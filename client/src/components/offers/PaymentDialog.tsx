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
    // تهيئة مكتبة ميسر للدفع
    if (isOpen && !isMoyasarInitialized) {
      // تحقق من وجود مفتاح API لميسر
      if (!import.meta.env.VITE_MOYASAR_PUBLIC_KEY) {
        setPaymentError("مفتاح API لبوابة الدفع غير متوفر");
        return;
      }

      // تحميل سكريبت ميسر إذا لم يكن موجوداً بالفعل
      if (!document.getElementById('moyasar-script')) {
        const script = document.createElement('script');
        script.id = 'moyasar-script';
        script.src = 'https://cdn.moyasar.com/mpf/1.7.3/moyasar.js';
        script.async = true;
        
        script.onload = () => {
          setIsMoyasarInitialized(true);
          initMoyasarForm();
        };
        
        script.onerror = () => {
          setPaymentError("فشل تحميل نظام الدفع");
        };
        
        document.body.appendChild(script);
      } else {
        // سكريبت ميسر موجود بالفعل
        setIsMoyasarInitialized(true);
        initMoyasarForm();
      }
    }
  }, [isOpen]);

  const initMoyasarForm = () => {
    // تنظيف حاوية الدفع أولاً
    const paymentContainer = document.getElementById('moyasar-payment-form');
    if (paymentContainer) {
      paymentContainer.innerHTML = '';
    }
    
    // تهيئة نموذج الدفع
    if (window.Moyasar) {
      window.Moyasar.init({
        element: '#moyasar-payment-form',
        amount: parseInt(depositAmount) * 100, // تحويل المبلغ إلى هللات
        currency: 'SAR',
        description: `عربون للعرض #${offer.id} على المشروع #${offer.projectId}`,
        publishable_api_key: import.meta.env.VITE_MOYASAR_PUBLIC_KEY,
        callback_url: window.location.href,
        methods: ['creditcard', 'applepay', 'stcpay', 'mada'],
        on_completed: handlePaymentCompleted,
      });
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
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
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
            <Button onClick={() => setPaymentError(null)}>إعادة المحاولة</Button>
          </div>
        ) : (
          <>
            <div id="moyasar-payment-form" className="mb-4"></div>
            
            <div className="text-sm text-gray-500 mt-4">
              <p>ملاحظة: سيتم خصم هذا المبلغ من القيمة الإجمالية للعقد مع الشركة.</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}