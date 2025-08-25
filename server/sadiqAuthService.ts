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
   * Upload document to Sadiq
   */
  async uploadDocument(base64Content: string, fileName: string): Promise<{id: string}> {
    console.log(`📄 رفع وثيقة إلى صادق: ${fileName}`);
    
    // Try different endpoint formats that might work with Sadiq API
    const endpoints = [
      '/IntegrationService/Document/Upload',
      '/api/Document/Upload',
      '/Document/Upload',
      '/IntegrationService/Documents/Upload',
      '/api/v1/documents/upload'
    ];

    let lastError: Error | null = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 محاولة رفع باستخدام endpoint: ${endpoint}`);
        
        // Try JSON format first
        let response = await this.makeAuthenticatedRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify({
            file: base64Content,
            fileName: fileName,
            contentType: 'application/pdf'
          })
        });

        // If JSON fails, try multipart/form-data format
        if (!response.ok && response.status === 405) {
          console.log(`🔄 محاولة رفع باستخدام multipart/form-data لـ: ${endpoint}`);
          
          // Create form data
          const formData = new FormData();
          
          // Convert base64 to blob for form data
          const pdfBuffer = Buffer.from(base64Content, 'base64');
          const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
          formData.append('file', blob, fileName);
          formData.append('fileName', fileName);
          formData.append('contentType', 'application/pdf');

          const accessToken = await this.getAccessToken();
          response = await fetch(`${this.BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
              // Don't set Content-Type, let the browser set it for multipart
            },
            body: formData
          });
        }

        if (response.ok) {
          const result = await response.json();
          
          // Handle different response formats
          if (result.errorCode === 0 || result.success || result.id) {
            const documentId = result.data?.id || result.id || result.documentId;
            console.log(`✅ تم رفع الوثيقة بنجاح - معرف الوثيقة: ${documentId}`);
            return { id: documentId };
          }
          
          if (result.errorCode !== 0) {
            throw new Error(`Sadiq upload error: ${result.message}`);
          }
        } else {
          console.log(`❌ فشل endpoint ${endpoint} مع حالة: ${response.status}`);
          lastError = new Error(`Failed to upload document: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ خطأ في endpoint ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }
    }

    // If all endpoints failed, throw the last error
    throw lastError || new Error('All upload endpoints failed');
  }

  /**
   * Send signing invitations via Sadiq
   */
  async sendSigningInvitations(invitationData: any): Promise<{envelopeId: string}> {
    console.log('📨 إرسال دعوات التوقيع الإلكتروني...');
    
    const response = await this.makeAuthenticatedRequest('/IntegrationService/Document/Bulk/Initiate/envelope', {
      method: 'POST',
      body: JSON.stringify(invitationData)
    });

    if (!response.ok) {
      throw new Error(`Failed to send invitations: ${response.status}`);
    }

    const result = await response.json();
    if (result.errorCode !== 0) {
      throw new Error(`Sadiq invitation error: ${result.message}`);
    }

    console.log(`✅ تم إرسال دعوات التوقيع بنجاح - معرف المغلف: ${result.data?.envelopeId}`);
    return { envelopeId: result.data?.envelopeId };
  }

  /**
   * Check envelope status
   */
  async getEnvelopeStatus(referenceNumber: string): Promise<any> {
    console.log(`🔍 التحقق من حالة المغلف: ${referenceNumber}`);
    
    const response = await this.makeAuthenticatedRequest(`/IntegrationService/Document/envelope/status/${referenceNumber}`, {
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