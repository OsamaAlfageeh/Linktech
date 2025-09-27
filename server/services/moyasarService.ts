// server/services/moyasarService.ts
import axios from 'axios';

class MoyasarService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.MOYASAR_SECRET_KEY!;
    this.baseURL = 'https://api.moyasar.com/v1';
  }

  private getAuthConfig() {
    // Create Basic Auth header manually
    const auth = Buffer.from(`${this.apiKey}:`).toString('base64');
    
    return {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    };
  }

  /**
   * Create a payment intent
   * @param amount Amount in SAR
   * @param description Payment description
   * @param callbackUrl Success callback URL
   */
  async createPaymentIntent(
    amount: number, 
    description: string = 'عمولة المنصة - Linktech',
    callbackUrl?: string
  ) {
    try {
      const paymentData = {
        amount: Math.round(amount * 100), // Convert SAR to halalas
        currency: 'SAR',
        description,
        callback_url: callbackUrl || `${process.env.FRONTEND_URL}/payment/success`,
        source: {
          type: 'creditcard'
        }
      };

      console.log('Creating Moyasar payment intent:', paymentData);
      
      const response = await axios.post(
        `${this.baseURL}/payments`,
        paymentData,
        this.getAuthConfig()
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Moyasar payment creation error:', error.response?.data || error.message);
      throw new Error('فشل في إنشاء طلب الدفع');
    }
  }

  /**
   * Confirm a payment with card details
   * @param paymentId Payment ID from Moyasar
   * @param source Card source details
   */
  async confirmPayment(paymentId: string, source: any) {
    try {
      console.log('Confirming Moyasar payment:', paymentId);
      
      const response = await axios.put(
        `${this.baseURL}/payments/${paymentId}`,
        { source },
        this.getAuthConfig()
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Moyasar payment confirmation error:', error.response?.data || error.message);
      throw new Error('فشل في تأكيد الدفع');
    }
  }

  /**
   * Retrieve payment details
   * @param paymentId Payment ID
   */
  async getPayment(paymentId: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/payments/${paymentId}`,
        this.getAuthConfig()
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Moyasar payment retrieval error:', error.response?.data || error.message);
      throw new Error('فشل في استرجاع تفاصيل الدفع');
    }
  }

  /**
   * List payments with filters
   * @param filters Optional filters
   */
  async listPayments(filters: any = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(
        `${this.baseURL}/payments?${params.toString()}`,
        this.getAuthConfig()
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Moyasar payments list error:', error.response?.data || error.message);
      throw new Error('فشل في استرجاع قائمة المدفوعات');
    }
  }

  /**
   * Refund a payment
   * @param paymentId Payment ID to refund
   * @param amount Amount to refund (optional, defaults to full amount)
   */
  async refundPayment(paymentId: string, amount?: number) {
    try {
      const refundData: any = {};
      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to halalas
      }

      const response = await axios.post(
        `${this.baseURL}/payments/${paymentId}/refund`,
        refundData,
        this.getAuthConfig()
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Moyasar refund error:', error.response?.data || error.message);
      throw new Error('فشل في استرداد المبلغ');
    }
  }

  /**
   * Create a payment with card details directly
   * @param amount Amount in SAR
   * @param cardDetails Card details
   * @param description Payment description
   */
  async createInvoice(
    amount: number,
    description: string = 'عمولة المنصة - Linktech',
    callbackUrl?: string,
    offerId?: number,
    projectId?: number
  ) {
    try {
      // Validate API key
      if (!this.apiKey) {
        console.error('❌ Moyasar API key is not configured');
        throw new Error('Moyasar API key is not configured');
      }

      // Validate amount
      if (!amount || amount <= 0) {
        console.error('❌ Invalid amount:', amount);
        throw new Error('Invalid payment amount');
      }

      // Ensure amount is at least 1 SAR (100 halalas)
      const minAmount = 1;
      if (amount < minAmount) {
        console.error('❌ Amount too small:', amount);
        throw new Error(`Minimum amount is ${minAmount} SAR`);
      }

      // Moyasar requires specific invoice data structure
      const invoiceData = {
        amount: Math.round(amount * 100), // Convert SAR to halalas
        currency: 'SAR',
        description: description.substring(0, 255), // Limit description length
        callback_url: callbackUrl || `${process.env.FRONTEND_URL}/payment/success`,
        success_url: `${process.env.FRONTEND_URL}/payment/success`,
        back_url: projectId ? `${process.env.FRONTEND_URL}/projects/${projectId}` : `${process.env.FRONTEND_URL}/dashboard`,
        expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        // Add metadata for tracking
        metadata: {
          offer_id: offerId?.toString(),
          project_id: projectId?.toString(),
          platform: 'linktech'
        }
      };

      // Validate URLs before sending (Moyasar requires HTTPS in production)
      const isDevelopment = process.env.NODE_ENV === 'development';
      const urlPattern = isDevelopment ? /^https?:\/\/[^\s/$.?#].[^\s]*$/i : /^https:\/\/[^\s/$.?#].[^\s]*$/i;
      
      if (!urlPattern.test(invoiceData.callback_url)) {
        const errorMsg = isDevelopment 
          ? `Invalid callback URL: ${invoiceData.callback_url}. Please check your FRONTEND_URL configuration.`
          : `Invalid callback URL: ${invoiceData.callback_url}. Moyasar requires HTTPS URLs in production. Please set FRONTEND_URL to use HTTPS.`;
        throw new Error(errorMsg);
      }
      if (!urlPattern.test(invoiceData.success_url)) {
        const errorMsg = isDevelopment 
          ? `Invalid success URL: ${invoiceData.success_url}. Please check your FRONTEND_URL configuration.`
          : `Invalid success URL: ${invoiceData.success_url}. Moyasar requires HTTPS URLs in production. Please set FRONTEND_URL to use HTTPS.`;
        throw new Error(errorMsg);
      }
      if (!urlPattern.test(invoiceData.back_url)) {
        const errorMsg = isDevelopment 
          ? `Invalid back URL: ${invoiceData.back_url}. Please check your FRONTEND_URL configuration.`
          : `Invalid back URL: ${invoiceData.back_url}. Moyasar requires HTTPS URLs in production. Please set FRONTEND_URL to use HTTPS.`;
        throw new Error(errorMsg);
      }

      // Create Basic Auth header correctly
      const authString = Buffer.from(`${this.apiKey}:`).toString('base64');
      
      console.log('🔍 Moyasar Invoice Creation Debug:');
      console.log('  - API Key exists:', !!this.apiKey);
      console.log('  - API Key length:', this.apiKey?.length || 0);
      console.log('  - API Key starts with:', this.apiKey?.substring(0, 10) || 'N/A');
      console.log('  - Base URL:', this.baseURL);
      console.log('  - Amount (SAR):', amount);
      console.log('  - Amount (halalas):', invoiceData.amount);
      console.log('  - Description:', invoiceData.description);
      console.log('  - Description length:', invoiceData.description.length);
      console.log('  - Callback URL:', invoiceData.callback_url);
      console.log('  - Success URL:', invoiceData.success_url);
      console.log('  - Back URL:', invoiceData.back_url);
      console.log('  - Expired at:', invoiceData.expired_at);
      console.log('  - Frontend URL:', process.env.FRONTEND_URL);
      console.log('  - Full invoice data:', JSON.stringify(invoiceData, null, 2));

      const response = await axios.post(
        `${this.baseURL}/invoices`,
        invoiceData,
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('✅ Moyasar invoice created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Moyasar invoice creation error:');
      console.error('  - Error message:', error.message);
      console.error('  - Error code:', error.code);
      console.error('  - Response status:', error.response?.status);
      console.error('  - Response data:', error.response?.data);
      console.error('  - Response headers:', error.response?.headers);
      console.error('  - Request config:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      });
      
      // Provide more specific error messages
      if (error.response?.status === 401) {
        throw new Error('Moyasar API key is invalid or expired');
      } else if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || 'Invalid request parameters';
        const errorDetails = error.response?.data?.errors || error.response?.data;
        console.error('  - Validation errors:', errorDetails);
        throw new Error(`Moyasar validation error: ${errorMsg}`);
      } else if (error.response?.status === 403) {
        throw new Error('Moyasar API access forbidden - check account status');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Cannot connect to Moyasar API - check network connection');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Moyasar API request timed out');
      }
      
      throw new Error(`فشل في إنشاء فاتورة الدفع: ${error.message}`);
    }
  }

  async getInvoice(invoiceId: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/invoices/${invoiceId}`,
        this.getAuthConfig()
      );
      return response.data;
    } catch (error: any) {
      console.error('Moyasar get invoice error:', error.response?.data || error.message);
      throw new Error('فشل في استرجاع حالة الفاتورة');
    }
  }
}

export default MoyasarService;