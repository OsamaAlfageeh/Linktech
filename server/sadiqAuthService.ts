/**
 * Sadiq Authentication Service
 * Handles automatic authentication with Sadiq API using email/password
 * Manages access token lifecycle and automatic refresh
 */

interface SadiqTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  error: string | null;
  errorMessage: string | null;
}

interface SadiqAuthCache {
  accessToken: string;
  expiresAt: number;
}

class SadiqAuthService {
  private tokenCache: SadiqAuthCache | null = null;
  private readonly BASE_URL = 'https://sandbox-api.sadq-sa.com';
  private readonly TOKEN_ENDPOINT = '/connect/token';

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      console.log('🔑 استخدام رمز الوصول المحفوظ مؤقتاً');
      return this.tokenCache.accessToken;
    }

    // Try to get fresh token via authentication
    try {
      console.log('🔄 محاولة الحصول على رمز وصول جديد من صادق...');
      const token = await this.authenticateWithSadiq();
      return token;
    } catch (authError) {
      console.warn('⚠️ المصادقة التلقائية لم تنجح، التحقق من رمز وصول يدوي...');
      
      // Fallback to manual token if available  
      const manualToken = process.env.SADIQ_ACCESS_TOKEN;
      if (manualToken && manualToken.length > 50) {
        console.log('✅ استخدام رمز الوصول المحفوظ مؤقتاً');
        this.tokenCache = {
          accessToken: manualToken,
          expiresAt: Date.now() + (2 * 60 * 60 * 1000) // Cache for 2 hours
        };
        return manualToken;
      }
      
      // More helpful error message
      const errorMsg = `
      ❌ لم يتم العثور على رمز وصول صالح لصادق
      
      لحل هذه المشكلة:
      1. تأكد من صحة SADIQ_EMAIL و SADIQ_PASSWORD في الأسرار
      2. أو أضف SADIQ_ACCESS_TOKEN الحالي في الأسرار
      3. يمكنك الحصول على رمز وصول من حسابك في صادق وإضافته مؤقتاً
      
      الخطأ الأصلي: ${authError.message}
      `;
      
      throw new Error(errorMsg);
    }
  }

  /**
   * Authenticate with Sadiq using email/password
   */
  private async authenticateWithSadiq(): Promise<string> {
    try {
      const email = process.env.SADIQ_EMAIL;
      const password = process.env.SADIQ_PASSWORD;

      if (!email || !password) {
        throw new Error('Sadiq email or password not configured in environment variables');
      }

      console.log(`📧 تسجيل الدخول في صادق باستخدام: ${email.substring(0, 3)}***`);

      // Use the correct Sadiq authentication endpoint
      const authConfigs = [
        {
          endpoint: 'https://sandbox-api.sadq-sa.com/Authentication/Authority/Token',
          params: {
            grant_type: 'integration',
            accountId: '98AA5961-3917-4595-A14B-ED5E99BDEBE4',
            accountSecret: 'DcQ8FhLKTZC1QoTZXFJRMKqVMLoilUr6',
            username: email,
            password: password
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic SW50ZWdyYXRpb25jbGllbnQ6ZHZuY3h6dmNkc3NoYmJ6YXZyd2lkc2JkdmRnZmRoc2JjdmJkZ2Y='
          }
        }
      ];

      for (const config of authConfigs) {
        console.log(`🔄 محاولة الاتصال بـ: ${config.endpoint}`);
        
        try {
          const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              ...config.headers
            },
            body: new URLSearchParams(config.params)
          });

          if (response.ok) {
            const tokenData: SadiqTokenResponse = await response.json();
            
            if (tokenData.error) {
              console.error(`❌ خطأ في المصادقة من ${config.endpoint}:`, tokenData.errorMessage);
              continue; // Try next endpoint
            }

            // Success! Cache the token with buffer time (subtract 5 minutes from expiry)
            const expiresAt = Date.now() + ((tokenData.expires_in - 300) * 1000);
            this.tokenCache = {
              accessToken: tokenData.access_token,
              expiresAt: expiresAt
            };

            console.log(`✅ تم تسجيل الدخول في صادق بنجاح من: ${config.endpoint}`);
            console.log(`⏰ صالح حتى: ${new Date(expiresAt).toLocaleString('ar-SA')}`);
            
            return tokenData.access_token;
          } else {
            console.log(`❌ ${config.endpoint} فشل بحالة: ${response.status}`);
            // Continue to next endpoint
          }
        } catch (endpointError) {
          const error = endpointError as Error;
          console.log(`❌ خطأ في الاتصال بـ ${config.endpoint}:`, error.message);
          // Continue to next endpoint
        }
      }

      // If all endpoints failed
      throw new Error('جميع نقاط المصادقة فشلت - تأكد من صحة بيانات تسجيل الدخول');

    } catch (error) {
      console.error('❌ خطأ في المصادقة مع صادق:', error);
      throw error;
    }
  }

  /**
   * Make authenticated request to Sadiq API
   */
  async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = await this.getAccessToken();
    
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    return fetch(`${this.BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
  }

  /**
   * Upload document to Sadiq using CORRECT API endpoint with webhook integration
   */
  async uploadDocument(base64Content: string, fileName: string): Promise<{id: string, referenceNumber: string}> {
    console.log(`📄 رفع وثيقة إلى صادق باستخدام API الصحيح مع webhook: ${fileName}`);
    
    try {
      // First, get or configure webhook
      let webhookId = await this.getOrCreateWebhook();
      
      // Use the CORRECT Sadiq API endpoint from user's curl
      const endpoint = '/IntegrationService/Document/Bulk/Initiate-envelope-Base64';
      const referenceNumber = `linktech-nda-project-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
      // Use EXACT data format from user's curl command but with real webhook ID
      const requestData = {
        webhookId: webhookId,
        referenceNumber: referenceNumber,
        files: [
          {
            file: base64Content,
            fileName: fileName,
            password: ""
          }
        ]
      };
      
      console.log(`🔄 رفع الوثيقة باستخدام endpoint: ${endpoint}`);
      console.log(`📋 معرف المرجع: ${referenceNumber}`);
      
      const response = await this.makeAuthenticatedRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`📋 Sadiq upload response:`, result);
        
        // Extract document ID from response - the real document ID is in bulkFileResponse
        let documentId = result.data?.documentId || result.documentId || result.data?.id || result.id;
        
        // Check bulkFileResponse for the actual document ID
        if (!documentId && result.data?.bulkFileResponse && result.data.bulkFileResponse.length > 0) {
          const firstFile = result.data.bulkFileResponse[0];
          documentId = firstFile?.documentId || firstFile?.id || firstFile?.fileId;
          console.log(`📋 استخراج معرف الوثيقة من bulkFileResponse: ${documentId}`);
        }
        
        // If still no document ID, use envelopeId as fallback instead of our reference
        if (!documentId) {
          documentId = result.data?.envelopeId || referenceNumber;
          console.log(`📋 استخدام envelopeId كبديل: ${documentId}`);
        }
        
        console.log(`✅ تم رفع الوثيقة بنجاح - معرف الوثيقة: ${documentId}`);
        return { id: documentId, referenceNumber };
      } else {
        const errorText = await response.text();
        console.log(`❌ فشل رفع الوثيقة مع حالة: ${response.status}`);
        console.log(`📄 تفاصيل الخطأ: ${errorText.substring(0, 200)}`);
        throw new Error(`Upload failed: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في رفع الوثيقة عبر صادق:`, error);
      throw error;
    }
  }

  /**
   * Format phone number to international format for Sadiq
   */
  private formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return "";
    
    // Remove any spaces, dashes, or parentheses
    const cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
    
    // STRICT VALIDATION FOR SADIQ API - Only accept exact formats
    // Must be +966XXXXXXXX (exactly 8 digits after +966)
    
    // Pattern: +966 followed by exactly 8 digits (mobile: 5XXXXXXX or landline: 1XXXXXXX)
    const sadiqFormat = /^\+966[15]\d{7}$/;
    
    // If already in correct Sadiq format, return as is
    if (sadiqFormat.test(cleaned)) {
      console.log(`📞 رقم متوافق مع صادق: ${cleaned}`);
      return cleaned;
    }
    
    // Pattern: 00966 followed by exactly 8 digits - convert to +966
    if (/^00966[15]\d{7}$/.test(cleaned)) {
      const converted = '+966' + cleaned.substring(5);
      console.log(`📞 تم تحويل ${cleaned} إلى ${converted}`);
      return converted;
    }
    
    // Convert 05XXXXXXXX to +9665XXXXXXX (trim to exactly 8 digits after +966)
    if (/^05\d{8}$/.test(cleaned)) {
      const converted = '+966' + cleaned.substring(1, 9); // Take only 8 digits after removing 0
      console.log(`📞 تم تحويل ${cleaned} إلى ${converted}`);
      return converted;
    }
    
    // Convert 01XXXXXXXX to +9661XXXXXXX (trim to exactly 8 digits after +966)
    if (/^01\d{8}$/.test(cleaned)) {
      const converted = '+966' + cleaned.substring(1, 9); // Take only 8 digits after removing 0
      console.log(`📞 تم تحويل ${cleaned} إلى ${converted}`);
      return converted;
    }
    
    // If format doesn't match any expected pattern, log error and return empty
    console.error(`❌ تنسيق رقم غير صحيح لصادق: ${cleaned} - يجب أن يكون +966 متبوعاً بـ 8 أرقام بالضبط`);
    return "";
  }

  /**
   * Send signing invitations via Sadiq using CORRECT API endpoint
   */
  async sendSigningInvitations(documentId: string, signatories: any[], projectTitle: string): Promise<{envelopeId: string}> {
    console.log('📨 إرسال دعوات التوقيع باستخدام API الصحيح...');
    
    try {
      // Use the CORRECT Sadiq API endpoint from user's curl
      const endpoint = '/IntegrationService/Invitation/Send-Invitation';
      
      // Use EXACT data format from user's curl command
      const requestData = {
        documentId: documentId,
        destinations: signatories.map((signatory, index) => ({
          destinationName: signatory.fullName,
          destinationEmail: signatory.email,
          destinationPhoneNumber: this.formatPhoneNumber(signatory.phoneNumber) || "",
          nationalId: signatory.nationalId || "",
          signeOrder: index,
          ConsentOnly: false, // Set to false since we want actual signatures
          signatories: [
            {
              signatureHigh: 80,
              signatureWidth: 160,
              pageNumber: 1,
              text: "",
              type: "Signature",
              positionX: 70 + (index * 200), // Different positions for each signer
              positionY: 500
            }
          ],
          availableTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          authenticationType: 0,
          InvitationLanguage: 1, // Arabic
          RedirectUrl: "",
          AllowUserToAddDestination: false
        })),
        invitationMessage: `نرجو منك توقيع اتفاقية عدم الإفصاح المرفقة للمشروع: ${projectTitle}`,
        invitationSubject: `اتفاقية عدم الإفصاح - مشروع ${projectTitle}`
      };
      
      console.log(`🔄 إرسال دعوات باستخدام endpoint: ${endpoint}`);
      console.log(`📧 عدد المدعوين: ${signatories.length}`);
      
      // طباعة البيانات الكاملة المرسلة إلى صادق
      console.log('📋 البيانات الكاملة المرسلة إلى صادق API:');
      console.log('📋 signatories input:', JSON.stringify(signatories, null, 2));
      console.log('📋 requestData.destinations:', JSON.stringify(requestData.destinations, null, 2));
      
      const response = await this.makeAuthenticatedRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`📋 Sadiq invitation response:`, result);
        
        // Check Sadiq's actual errorCode - 0 means success
        if (result.errorCode === 0) {
          // Extract envelope/invitation ID from response
          const envelopeId = result.data?.envelopeId || result.envelopeId || result.data?.id || result.id || documentId;
          
          console.log(`✅ تم إرسال دعوات التوقيع بنجاح - معرف المغلف: ${envelopeId}`);
          return { envelopeId };
        } else {
          // Sadiq returned an error (errorCode !== 0)
          const errorMessage = result.message || `Sadiq error code: ${result.errorCode}`;
          console.log(`❌ فشل إرسال الدعوات من صادق - كود الخطأ: ${result.errorCode}`);
          console.log(`📄 رسالة الخطأ: ${errorMessage}`);
          throw new Error(`Sadiq invitation failed: ${errorMessage} (Code: ${result.errorCode})`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ فشل إرسال الدعوات مع حالة: ${response.status}`);
        console.log(`📄 تفاصيل الخطأ: ${errorText.substring(0, 200)}`);
        throw new Error(`Invitation failed: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في إرسال الدعوات عبر صادق:`, error);
      throw error;
    }
  }

  /**
   * Check envelope status
   */
  async getEnvelopeStatus(referenceNumber: string): Promise<any> {
    console.log(`🔍 التحقق من حالة المغلف: ${referenceNumber}`);
    
    const response = await this.makeAuthenticatedRequest(`/IntegrationService/Document/envelope-status/referenceNumber/${referenceNumber}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Failed to get envelope status: ${response.status}`);
    }

    const result = await response.json();
    if (result.errorCode !== 0) {
      throw new Error(`Sadiq status check error: ${result.message}`);
    }

    return result.data;
  }

  // Configure webhook for receiving status notifications
  async configureWebhook(): Promise<string | null> {
    try {
      const token = await this.getAccessToken();
      
      // Get the current domain for webhook URL
      const webhookUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/sadiq/webhook`
        : 'https://your-domain.replit.app/api/sadiq/webhook';
      
      console.log(`🔗 تكوين webhook على: ${webhookUrl}`);
      
      const webhookConfig = {
        webhookUrl: webhookUrl,
        isDefault: true,
        HeaderToken: "linktech-webhook-secret-2025" // Security token for verification
      };

      const response = await fetch(`${this.BASE_URL}/IntegrationService/Configuration/webhook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(webhookConfig)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`⚠️ فشل في تكوين webhook: ${response.status} ${response.statusText}`, errorText);
        return null;
      }

      const data = await response.json();
      console.log(`✅ تم تكوين webhook بنجاح:`, data);
      return data.id || data.webhookId; // Return webhook ID
    } catch (error) {
      console.error('❌ خطأ في تكوين webhook:', error);
      return null;
    }
  }

  // Get existing webhook configuration
  async getWebhooks(): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      
      console.log('📋 استرجاع تكوينات webhook');
      
      const response = await fetch(`${this.BASE_URL}/IntegrationService/Configuration/webhook`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`⚠️ فشل في استرجاع webhooks: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      console.log(`✅ تم استرجاع ${data.length || 0} webhook`);
      return data || [];
    } catch (error) {
      console.error('❌ خطأ في استرجاع webhooks:', error);
      return [];
    }
  }

  // Get or create webhook for our application
  async getOrCreateWebhook(): Promise<string> {
    try {
      // First, try to get existing webhooks
      const existingWebhooks = await this.getWebhooks();
      
      // Check if we already have a webhook for our domain
      const currentDomain = process.env.REPLIT_DEV_DOMAIN;
      const ourWebhook = existingWebhooks.find(webhook => 
        webhook.webhookUrl && webhook.webhookUrl.includes(currentDomain || 'replit.app')
      );
      
      if (ourWebhook && ourWebhook.id) {
        console.log(`✅ تم العثور على webhook موجود: ${ourWebhook.id}`);
        return ourWebhook.id;
      }
      
      // No existing webhook found, create a new one
      console.log('🔗 لم يتم العثور على webhook موجود، إنشاء جديد...');
      const webhookId = await this.configureWebhook();
      
      if (!webhookId) {
        // Fallback to a default webhook ID if configuration fails
        console.log('⚠️ فشل في إنشاء webhook، استخدام معرف افتراضي');
        return "3fa85f64-5717-4562-b3fc-2c963f66afa6";
      }
      
      return webhookId;
    } catch (error) {
      console.error('❌ خطأ في الحصول على أو إنشاء webhook:', error);
      // Fallback to default webhook ID
      return "3fa85f64-5717-4562-b3fc-2c963f66afa6";
    }
  }

  /**
   * Download signed document
   */
  async downloadSignedDocument(documentId: string): Promise<string> {
    console.log(`⬇️ تنزيل الوثيقة الموقعة: ${documentId}`);
    
    const response = await this.makeAuthenticatedRequest(`/IntegrationService/Document/DownloadBase64/${documentId}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.status}`);
    }

    const result = await response.json();
    if (result.errorCode !== 0) {
      throw new Error(`Sadiq download error: ${result.message}`);
    }

    console.log('✅ تم تنزيل الوثيقة الموقعة بنجاح');
    return result.data.file; // Base64 content
  }

  /**
   * Clear cached token (for testing or manual refresh)
   */
  clearTokenCache(): void {
    this.tokenCache = null;
    console.log('🗑️ تم مسح رمز الوصول المحفوظ مؤقتاً');
  }
}

// Export singleton instance
export const sadiqAuth = new SadiqAuthService();