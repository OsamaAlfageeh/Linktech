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
      console.log('🔄 الحصول على رمز وصول جديد من صادق...');
      const token = await this.authenticateWithSadiq();
      return token;
    } catch (authError) {
      console.warn('⚠️ فشل في المصادقة التلقائية، التحقق من وجود رمز وصول يدوي...');
      
      // Fallback to manual token if available
      const manualToken = process.env.SADIQ_ACCESS_TOKEN;
      if (manualToken) {
        console.log('✅ استخدام رمز الوصول اليدوي المحفوظ');
        // Cache the manual token for a reasonable time (1 hour)
        this.tokenCache = {
          accessToken: manualToken,
          expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
        };
        return manualToken;
      }
      
      // If no fallback token, throw the original error
      throw authError;
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

      const response = await fetch(`${this.BASE_URL}${this.TOKEN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: email,
          password: password,
          client_id: 'Integrationclient',
          scope: 'Integrationscope',
          client_secret: '' // Some systems require this even if empty
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ فشل في المصادقة مع صادق:', response.status, errorText);
        throw new Error(`Sadiq authentication failed: ${response.status} ${errorText}`);
      }

      const tokenData: SadiqTokenResponse = await response.json();

      if (tokenData.error) {
        console.error('❌ خطأ في المصادقة:', tokenData.errorMessage);
        throw new Error(`Sadiq authentication error: ${tokenData.errorMessage}`);
      }

      // Cache the token with buffer time (subtract 5 minutes from expiry)
      const expiresAt = Date.now() + ((tokenData.expires_in - 300) * 1000);
      this.tokenCache = {
        accessToken: tokenData.access_token,
        expiresAt: expiresAt
      };

      console.log('✅ تم تسجيل الدخول في صادق بنجاح');
      console.log(`⏰ صالح حتى: ${new Date(expiresAt).toLocaleString('ar-SA')}`);

      return tokenData.access_token;

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
    
    const response = await this.makeAuthenticatedRequest('/IntegrationService/Document/UploadBase64', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          file: base64Content,
          fileName: fileName,
          contentType: 'application/pdf'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to upload document: ${response.status}`);
    }

    const result = await response.json();
    if (result.errorCode !== 0) {
      throw new Error(`Sadiq upload error: ${result.message}`);
    }

    console.log(`✅ تم رفع الوثيقة بنجاح - معرف الوثيقة: ${result.data.id}`);
    return { id: result.data.id };
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