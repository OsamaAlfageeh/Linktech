import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";

interface Offer {
  id: number;
  projectId: number;
  companyId: number;
  amount: string;
  duration: string;
  description: string;
  status: string;
  depositPaid: boolean;
  depositAmount: string | null;
  depositDate: string | null;
  contactRevealed: boolean;
  createdAt: string;
  companyName?: string;
  companyLogo?: string;
  companyVerified?: boolean;
  companyRating?: number;
  companyEmail?: string;
  companyUsername?: string;
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
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Debug: Log offer data when component mounts or offer changes
  useEffect(() => {
    console.log("PaymentDialog - offer received:", offer);
    console.log("PaymentDialog - offer.id:", offer?.id);
  }, [offer]);
  
  // Card-related state removed - using Moyasar invoice system

  // حساب مبلغ عمولة المنصة (2.5% من قيمة العرض) إذا لم يكن محدداً بالفعل
  const depositAmount = offer.depositAmount || 
    Math.round(parseFloat(offer.amount.replace(/[^0-9.]/g, '')) * 0.025).toString();
  
  // عند إغلاق النافذة، نعيد تعيين الحالات
  useEffect(() => {
    if (!isOpen) {
      setPaymentError(null);
      setPaymentSuccess(false);
    }
  }, [isOpen]);

  // Card formatting and validation functions removed - using Moyasar invoice system

  // معالجة تقديم نموذج الدفع
  const handlePaymentSubmit = async () => {
    setPaymentError(null);
    setIsLoading(true);
    
    try {
      // Always use Moyasar for real payments
      await handleMoyasarPayment();
      
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || "حدث خطأ أثناء معالجة الدفع");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoyasarPayment = async () => {
    try {
      // Debug: Check if offer and offer.id exist
      console.log("Debug - Moyasar offer object:", offer);
      console.log("Debug - Moyasar offer.id:", offer.id);
      
      if (!offer) {
        throw new Error("خطأ: لم يتم العثور على بيانات العرض");
      }
      
      if (!offer.id) {
        console.error("Moyasar Offer ID is missing:", offer);
        throw new Error("خطأ: معرف العرض غير موجود. يرجى المحاولة مرة أخرى");
      }
      
      // إنشاء فاتورة الدفع مع Moyasar
      const res = await apiRequest("POST", `/api/offers/${offer.id}/pay-deposit`, {
        depositAmount
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "فشل في إنشاء فاتورة الدفع");
      }
      
      const data = await res.json();
      console.log("استجابة إنشاء فاتورة الدفع:", data);
      
      if (data.success && data.paymentUrl) {
        // إعادة توجيه المستخدم إلى صفحة الدفع في Moyasar
        window.open(data.paymentUrl, '_blank');
        
        toast({
          title: "تم إنشاء فاتورة الدفع",
          description: "سيتم فتح صفحة الدفع في نافذة جديدة. بعد إتمام الدفع، ستظهر معلومات التواصل مع الشركة.",
        });
        
        // إغلاق نافذة الدفع
        onClose();
      } else {
        throw new Error("فشل في إنشاء فاتورة الدفع");
      }
      
    } catch (error: any) {
      console.error('Moyasar payment error:', error);
      throw new Error(error.message || "فشل في معالجة الدفع مع Moyasar");
    }
  };

  const handleTestPayment = async () => {
    try {
      // Debug: Check if offer and offer.id exist
      console.log("Debug - offer object:", offer);
      console.log("Debug - offer.id:", offer.id);
      
      if (!offer) {
        throw new Error("خطأ: لم يتم العثور على بيانات العرض");
      }
      
      if (!offer.id) {
        console.error("Offer ID is missing:", offer);
        throw new Error("خطأ: معرف العرض غير موجود. يرجى المحاولة مرة أخرى");
      }

      // محاكاة تأخير الشبكة
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // إرسال معلومات الدفع إلى الخادم
      console.log("إرسال طلب دفع عمولة المنصة للعرض رقم:", offer.id);
      const res = await apiRequest("POST", `/api/offers/${offer.id}/pay-deposit`, {
        paymentId: `test-${Date.now()}`,
        depositAmount
      });
      
      // التأكد من أن الاستجابة ناجحة
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "فشل تأكيد الدفع");
      }
      
      const data = await res.json().catch(() => ({}));
      console.log("استجابة دفع عمولة المنصة:", data);
      
      // تحديث الواجهة بناءً على الاستجابة
      if (data.companyContact) {
        console.log("تم استلام معلومات الشركة:", data.companyContact);
        // تحديث بيانات العرض مع معلومات الشركة الجديدة
        offer.companyEmail = data.companyContact.email;
        offer.companyUsername = data.companyContact.username;
      }
      
      setPaymentSuccess(true);
      
      toast({
        title: "تم الدفع بنجاح",
        description: "تم دفع عمولة المنصة وكشف معلومات التواصل مع الشركة",
      });
      
      // إعادة تحميل البيانات قبل إغلاق النافذة
      onPaymentSuccess();
      
      // انتظار فترة لعرض رسالة النجاح ثم إغلاق النافذة
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error(error);
      setPaymentError(error instanceof Error ? error.message : "حدث خطأ أثناء معالجة الدفع");
      
      toast({
        title: "فشل عملية الدفع",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>دفع عمولة المنصة</DialogTitle>
          <DialogDescription>
            يرجى دفع مبلغ عمولة المنصة (2.5% من قيمة العرض) لاستكمال عملية قبول العرض وكشف معلومات التواصل مع الشركة.
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
        ) : paymentSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-green-600"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">تم الدفع بنجاح</h3>
            <p className="text-gray-600 mb-4">
              لقد تم خصم {depositAmount} ريال سعودي من بطاقتك بنجاح.
              <br />
              يمكنك الآن الاطلاع على معلومات التواصل مع الشركة.
            </p>
          </div>
        ) : paymentError ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-red-600"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">فشل عملية الدفع</h3>
            <p className="text-red-500 mb-4">{paymentError}</p>
            <Button onClick={() => setPaymentError(null)}>إعادة المحاولة</Button>
          </div>
        ) : (
          <div>
            <Card className="mb-4 border-2 border-primary/10">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center justify-between">
                  <span>دفع عمولة المنصة</span>
                  <CreditCard className="h-5 w-5 text-primary" />
                </CardTitle>
                <CardDescription>
                  سيتم توجيهك إلى صفحة آمنة لإتمام عملية الدفع
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {depositAmount} ريال سعودي
                  </div>
                  <p className="text-gray-600">مبلغ عمولة المنصة (2.5% من قيمة العرض)</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <CreditCard className="h-4 w-4 ml-2" />
                    <span>دفع آمن ومحمي بواسطة Moyasar</span>
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                    <span>معتمد من البنك المركزي السعودي</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-primary/5 flex justify-center p-4">
                <Button 
                  onClick={handlePaymentSubmit} 
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري إنشاء فاتورة الدفع...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CreditCard className="ml-2 h-4 w-4" />
                      المتابعة للدفع
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="text-sm text-gray-500 mt-4 p-4 bg-gray-50 rounded-lg">
              <p>ملاحظة: سيتم خصم هذا المبلغ من القيمة الإجمالية للعقد مع الشركة.</p>
              <p className="mt-2 font-medium">الدفع آمن ومحمي بواسطة <span className="text-primary font-bold">Moyasar</span> - مزود الدفع الرائد في المملكة العربية السعودية.</p>
            </div>
          </div>
        )}
        
        <DialogFooter className="mt-4">
          {!isLoading && !paymentSuccess && (
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}