import axios from 'axios';

class MoyasarService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_MOYASAR_SECRET_KEY || 'sk_test_your_key_here';
    this.baseURL = 'https://api.moyasar.com/v1';
  }

  private getAuthConfig() {
    // Create Basic Auth header manually using browser-compatible base64
    const auth = btoa(`${this.apiKey}:`);
    
    return {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    };
  }

  /**
   * Retrieve invoice details
   * @param invoiceId Invoice ID
   */
  async getInvoice(invoiceId: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/invoices/${invoiceId}`,
        this.getAuthConfig()
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Moyasar invoice retrieval error:', error.response?.data || error.message);
      throw new Error('فشل في استرجاع تفاصيل الفاتورة');
    }
  }
}

export default MoyasarService;
