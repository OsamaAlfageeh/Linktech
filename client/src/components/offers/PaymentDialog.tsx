import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// تعريف النوع للكائن Moyasar
declare global {
  interface Window {
    Moyasar: {
      init: (options: {
        element: string;
        amount: number;
        currency: string;
        description: string;
        publishable_api_key: string;
        callback_url: string;
        methods: string[];
        on_completed: (payment: any) => void;
      }) => void;
    };
  }
}

interface Offer {
  id: number;
  projectId: number;
  amount: string;
  depositAmount?: string;
  status: string;
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer;
  onPaymentSuccess: () => void;
}

export function PaymentDialog({
  isOpen,
  onClose,
  offer,
  onPaymentSuccess,
}: PaymentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isMoyasarInitialized, setIsMoyasarInitialized] = useState(false);

  // حساب مبلغ العربون (10% من قيمة العرض) إذا لم يكن محدداً بالفعل
  const depositAmount = offer.depositAmount || 
    Math.round(parseFloat(offer.amount.replace(/[^0-9.]/g, '')) * 0.1).toString();

  useEffect(() => {
    const loadMoyasarScript = async () => {
      try {
        // تهيئة مكتبة ميسر للدفع
        if (isOpen && !isMoyasarInitialized) {
          console.log("بدء تحميل سكريبت ميسر...");
          
          // تحقق من وجود مفتاح API لميسر
          if (!import.meta.env.VITE_MOYASAR_PUBLIC_KEY) {
            console.error("مفتاح API لبوابة الدفع غير متوفر");
            setPaymentError("مفتاح API لبوابة الدفع غير متوفر. يرجى التواصل مع مسؤول النظام.");
            return;
          }
          
          // تنظيف أي سكريبت سابق قد يكون موجوداً
          const existingScript = document.getElementById('moyasar-script');
          if (existingScript) {
            console.log("إزالة سكريبت موياسر السابق");
            existingScript.remove();
          }
          
          // إنشاء عنصر سكريبت جديد
          const script = document.createElement('script');
          script.id = 'moyasar-script';
          script.src = 'https://cdn.moyasar.com/mpf/1.7.3/moyasar.js';
          script.async = true;
          
          // تعريف مستمعي الأحداث قبل إضافة السكريبت للصفحة
          const scriptLoadPromise = new Promise((resolve, reject) => {
            script.onload = () => {
              console.log("تم تحميل سكريبت ميسر بنجاح");
              resolve(true);
            };
            
            script.onerror = (error) => {
              console.error("فشل تحميل سكريبت ميسر:", error);
              reject(new Error("فشل تحميل نظام الدفع"));
            };
          });
          
          // إضافة السكريبت للصفحة
          document.body.appendChild(script);
          
          // انتظار تحميل السكريبت
          await scriptLoadPromise;
          
          // بعد التحميل، تهيئة النموذج
          console.log("تعيين حالة تهيئة ميسر وبدء تهيئة النموذج");
          setIsMoyasarInitialized(true);
          
          // إعطاء وقت إضافي للتأكد من تحميل المكتبة بشكل كامل
          setTimeout(() => {
            initMoyasarForm();
          }, 500);
        }
      } catch (error) {
        console.error("خطأ في تحميل سكريبت ميسر:", error);
        setPaymentError(error instanceof Error ? error.message : "فشل تحميل نظام الدفع");
      }
    };
    
    loadMoyasarScript();
  }, [isOpen]);

  const initMoyasarForm = () => {
    try {
      console.log("تهيئة نموذج دفع ميسر...");
      
      // تنظيف حاوية الدفع أولاً
      const paymentContainer = document.getElementById('moyasar-payment-form');
      if (paymentContainer) {
        paymentContainer.innerHTML = '';
        console.log("تم تنظيف حاوية الدفع");
      } else {
        console.error("لم يتم العثور على عنصر حاوية الدفع: moyasar-payment-form");
      }
      
      // تأكد من تحميل مكتبة ميسر
      if (typeof window.Moyasar === 'undefined') {
        console.error("مكتبة Moyasar غير محملة");
        setPaymentError("فشل تحميل نظام الدفع. يرجى تحديث الصفحة والمحاولة مرة أخرى.");
        return;
      }
      
      console.log("بدء تهيئة نموذج الدفع Moyasar");
      
      // تحويل المبلغ إلى رقم وضربه في 100 لتحويله إلى هللات
      const amountInHalalas = Math.round(parseFloat(depositAmount) * 100);
      console.log(`المبلغ بالهللات: ${amountInHalalas}`);
      
      // تهيئة نموذج الدفع
      window.Moyasar.init({
        element: '#moyasar-payment-form',
        amount: amountInHalalas,
        currency: 'SAR',
        description: `عربون للعرض #${offer.id} على المشروع #${offer.projectId}`,
        publishable_api_key: import.meta.env.VITE_MOYASAR_PUBLIC_KEY,
        callback_url: window.location.href,
        methods: ['creditcard', 'applepay', 'stcpay', 'mada'],
        on_completed: handlePaymentCompleted,
      });
      
      console.log("تم تهيئة نموذج الدفع بنجاح");
    } catch (error) {
      console.error("خطأ في تهيئة نموذج الدفع:", error);
      setPaymentError(`فشل تهيئة نموذج الدفع: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
    }
  };

  const handlePaymentCompleted = async (payment: any) => {
    try {
      setIsLoading(true);
      
      // إرسال معلومات الدفع إلى الخادم
      const res = await apiRequest("POST", `/api/offers/${offer.id}/pay-deposit`, {
        paymentId: payment.id,
        depositAmount
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل تأكيد الدفع");
      }
      
      const data = await res.json();
      
      toast({
        title: "تم الدفع بنجاح",
        description: "تم دفع العربون وكشف معلومات التواصل مع الشركة",
      });
      
      // إغلاق نافذة الدفع
      onClose();
      
      // استدعاء دالة النجاح
      onPaymentSuccess();
      
    } catch (error) {
      console.error(error);
      setPaymentError(error instanceof Error ? error.message : "حدث خطأ أثناء معالجة الدفع");
      
      toast({
        title: "فشل تأكيد الدفع",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // معالجة أخطاء ميسر
  const handleMoyasarError = (error: any) => {
    console.error('Moyasar payment error:', error);
    setPaymentError(error.message || "حدث خطأ أثناء عملية الدفع");
    
    toast({
      title: "فشل عملية الدفع",
      description: error.message || "حدث خطأ أثناء عملية الدفع، يرجى المحاولة مرة أخرى",
      variant: "destructive",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>دفع العربون</DialogTitle>
          <DialogDescription>
            يرجى دفع مبلغ العربون (10% من قيمة العرض) لاستكمال عملية قبول العرض وكشف معلومات التواصل مع الشركة.
            <br />
            <strong className="block mt-2">
              المبلغ المطلوب: {depositAmount} ريال سعودي
            </strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>جاري معالجة الدفع...</p>
          </div>
        ) : paymentError ? (
          <div className="text-center py-6">
            <p className="text-destructive mb-4">{paymentError}</p>
            <Button onClick={() => {
              setPaymentError(null);
              // إعادة محاولة تحميل سكريبت Moyasar
              setIsMoyasarInitialized(false);
            }}>إعادة المحاولة</Button>
          </div>
        ) : (
          <>
            <div id="moyasar-payment-form" className="mb-4 min-h-[200px] border rounded-lg p-4"></div>
            
            <div className="flex justify-center my-4">
              {!window.Moyasar && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsMoyasarInitialized(false);
                    setTimeout(() => initMoyasarForm(), 1000);
                  }}
                >
                  <div className="flex items-center">
                    <span className="ml-2">تحميل نموذج الدفع</span>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </Button>
              )}
            </div>
            
            <div className="text-sm text-gray-500 mt-4">
              <p>ملاحظة: سيتم خصم هذا المبلغ من القيمة الإجمالية للعقد مع الشركة.</p>
              <p className="mt-2">بيانات بطاقة الاختبار: رقم البطاقة 4111111111111111، تاريخ الانتهاء أي تاريخ مستقبلي، CVV أي ثلاثة أرقام.</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}