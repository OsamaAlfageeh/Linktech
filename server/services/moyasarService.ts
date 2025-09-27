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
      const invoiceData = {
        amount: Math.round(amount * 100), // Convert SAR to halalas
        currency: 'SAR',
        description,
        callback_url: callbackUrl || `${process.env.FRONTEND_URL}/payment/success`,
        success_url: projectId ? `${process.env.FRONTEND_URL}/projects/${projectId}?payment=success&offerId=${offerId}` : `${process.env.FRONTEND_URL}/dashboard?payment=success`,
        back_url: projectId ? `${process.env.FRONTEND_URL}/projects/${projectId}` : `${process.env.FRONTEND_URL}/dashboard`,
        expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };

      // Create Basic Auth header correctly
      
      const authString = Buffer.from(`${this.apiKey}:`).toString('base64');
      console.log('🔍 Debug - Authorization header:', `Basic ${authString}`);
      console.log('🔍 Debug - Secret key:', this.apiKey);
      console.log('🔍 Debug - Invoice data:', invoiceData);
      console.log('🔍 Debug - Base URL:', this.baseURL);

      const response = await axios.post(
        `${this.baseURL}/invoices`,
        invoiceData,
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Moyasar invoice creation error:', error.response?.data || error.message);
      throw new Error('فشل في إنشاء فاتورة الدفع');
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