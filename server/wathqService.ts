/**
 * Wathq API Service
 * خدمة للتحقق من صحة السجل التجاري عبر منصة وثيق
 */

interface WathqCompanyInfo {
  crNumber: string;
  companyName: string;
  companyNameEn: string;
  status: string;
  type: string;
  registrationDate: string;
  capital: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  activities: string[];
  partners: Array<{
    name: string;
    nationality: string;
    percentage: number;
  }>;
}

interface WathqApiResponse {
  success: boolean;
  data?: WathqCompanyInfo;
  error?: string;
  message?: string;
}

class WathqService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.WATHQ_API_URL || 'https://api.wathq.sa/sandbox/commercial-registration';
    this.apiKey = process.env.WATHQ_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ WATHQ_API_KEY not found in environment variables');
    }
  }

  /**
   * التحقق من صحة السجل التجاري والحصول على معلومات الشركة
   * @param crNumber رقم السجل التجاري
   * @returns معلومات الشركة من وثيق
   */
  async verifyCommercialRegistry(crNumber: string): Promise<WathqApiResponse> {
    try {
      console.log(`🔍 التحقق من السجل التجاري: ${crNumber}`);
      
      if (!this.apiKey) {
        throw new Error('Wathq API key is not configured');
      }

      // تنظيف رقم السجل التجاري (إزالة المسافات والرموز)
      const cleanCrNumber = crNumber.replace(/[^0-9]/g, '');
      
      if (cleanCrNumber.length < 10) {
        throw new Error('رقم السجل التجاري غير صالح - يجب أن يكون 10 أرقام على الأقل');
      }

      const url = `${this.baseUrl}/fullinfo/${cleanCrNumber}?language=ar`;
      
      console.log(`📡 استدعاء وثيق API: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'apiKey': this.apiKey
        },
        // إضافة timeout للطلب
        signal: AbortSignal.timeout(10000) // 10 ثواني
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ خطأ في استدعاء وثيق API: ${response.status} - ${errorText}`);
        
        if (response.status === 404) {
          return {
            success: false,
            error: 'السجل التجاري غير موجود في قاعدة بيانات وثيق',
            message: 'يرجى التحقق من صحة رقم السجل التجاري'
          };
        }
        
        if (response.status === 401) {
          return {
            success: false,
            error: 'خطأ في المصادقة مع وثيق',
            message: 'يرجى التحقق من إعدادات API key'
          };
        }
        
        return {
          success: false,
          error: `خطأ في API: ${response.status}`,
          message: errorText.substring(0, 200)
        };
      }

      const data = await response.json();
      console.log('✅ تم الحصول على معلومات الشركة من وثيق');
      console.log('📋 استجابة وثيق كاملة:', JSON.stringify(data, null, 2));
      
      // التحقق من صحة البيانات المستلمة
      if (!data || !data.crNumber) {
        return {
          success: false,
          error: 'بيانات غير صحيحة من وثيق',
          message: 'لم يتم العثور على معلومات صحيحة للشركة'
        };
      }

      // التحقق من حالة الشركة
      if (data.status && data.status.name && data.status.name !== 'نشط') {
        return {
          success: false,
          error: 'الشركة غير نشطة',
          message: `حالة الشركة: ${data.status.name} - يجب أن تكون الشركة نشطة لتوقيع اتفاقيات عدم الإفصاح`
        };
      }

      return {
        success: true,
        data: {
          crNumber: data.crNumber,
          crNationalNumber: data.crNationalNumber,
          companyName: data.name || 'غير محدد',
          status: data.status?.name || 'غير محدد',
          entityType: data.entityType?.name || 'غير محدد',
          formType: data.entityType?.formName || 'غير محدد',
          registrationDate: data.issueDateGregorian || 'غير محدد',
          capital: data.crCapital || data.capital?.contributionCapital?.contributionValue || 'غير محدد',
          currency: data.capital?.currencyName || 'ريال سعودي',
          city: data.headquarterCityName || 'غير محدد',
          phone: data.contactInfo?.mobileNo || data.contactInfo?.phoneNo,
          email: data.contactInfo?.email,
          website: data.contactInfo?.websiteUrl,
          activities: data.activities || [],
          partners: data.parties || [],
          management: data.management?.managers || [],
          isActive: data.status?.name === 'نشط',
          isLiquidation: data.inLiquidationProcess || false,
          hasEcommerce: data.hasEcommerce || false,
          // إرجاع البيانات الكاملة للاختبار
          fullResponse: data
        }
      };

    } catch (error) {
      console.error('❌ خطأ في التحقق من السجل التجاري:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'انتهت مهلة الاتصال مع وثيق',
            message: 'يرجى المحاولة مرة أخرى'
          };
        }
        
        return {
          success: false,
          error: error.message,
          message: 'حدث خطأ أثناء التحقق من السجل التجاري'
        };
      }
      
      return {
        success: false,
        error: 'خطأ غير معروف',
        message: 'حدث خطأ غير متوقع أثناء التحقق من السجل التجاري'
      };
    }
  }

  /**
   * التحقق من تطابق اسم الشركة مع السجل التجاري
   * @param crNumber رقم السجل التجاري
   * @param companyName اسم الشركة المدخل
   * @returns نتيجة التحقق
   */
  async verifyCompanyName(crNumber: string, companyName: string): Promise<{
    success: boolean;
    isMatch: boolean;
    registeredName?: string;
    error?: string;
  }> {
    try {
      const verification = await this.verifyCommercialRegistry(crNumber);
      
      if (!verification.success || !verification.data) {
        return {
          success: false,
          isMatch: false,
          error: verification.error
        };
      }

      const registeredName = verification.data.companyName;
      const isMatch = this.normalizeCompanyName(companyName) === this.normalizeCompanyName(registeredName);
      
      return {
        success: true,
        isMatch,
        registeredName
      };
      
    } catch (error) {
      console.error('❌ خطأ في التحقق من اسم الشركة:', error);
      return {
        success: false,
        isMatch: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  /**
   * تطبيع اسم الشركة للمقارنة
   * @param name اسم الشركة
   * @returns اسم الشركة مطبيع
   */
  private normalizeCompanyName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s]/g, '') // إزالة الرموز الخاصة
      .replace(/\s+/g, ' ') // توحيد المسافات
      .trim();
  }
}

// إنشاء instance واحد للخدمة
export const wathqService = new WathqService();

// تصدير الأنواع للاستخدام في الملفات الأخرى
export type { WathqCompanyInfo, WathqApiResponse };
