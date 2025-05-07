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
import { Loader2, CreditCard } from "lucide-react";
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
  
  // بيانات البطاقة
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // حساب مبلغ العربون (10% من قيمة العرض) إذا لم يكن محدداً بالفعل
  const depositAmount = offer.depositAmount || 
    Math.round(parseFloat(offer.amount.replace(/[^0-9.]/g, '')) * 0.1).toString();
  
  // عند إغلاق النافذة، نعيد تعيين الحالات
  useEffect(() => {
    if (!isOpen) {
      setPaymentError(null);
      setPaymentSuccess(false);
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
      setCardName("");
    }
  }, [isOpen]);

  // تنسيق رقم البطاقة أثناء الكتابة
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // تنسيق تاريخ الانتهاء
  const formatExpiryDate = (value: string) => {
    // إزالة أي شيء ما عدا الأرقام
    const v = value.replace(/[^0-9]/g, '');
    
    // إذا كان المستخدم قام بحذف آخر رقم عند "/"، نعود للنص دون "/"
    if (value.endsWith('/')) {
      return value.substring(0, value.length - 1);
    }
    
    // تنسيق MM/YY
    if (v.length >= 1 && v.length <= 2) {
      return v;
    } else if (v.length > 2) {
      // إضافة "/" بعد أول رقمين
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return value;
  };
  
  // التحقق من صلاحية البطاقة
  const isValidCardDetails = () => {
    const cleanCardNumber = cardNumber.replace(/\s+/g, '');
    
    // التحقق من رقم البطاقة (يجب أن يكون 16 رقم)
    if (!/^\d{16}$/.test(cleanCardNumber)) {
      setPaymentError("رقم البطاقة يجب أن يكون 16 رقم");
      return false;
    }
    
    // التحقق من تاريخ الانتهاء (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      setPaymentError("صيغة تاريخ الانتهاء غير صحيحة، يجب أن تكون MM/YY");
      return false;
    }
    
    // التحقق من الشهر (01-12)
    const month = parseInt(expiryDate.substring(0, 2));
    if (month < 1 || month > 12) {
      setPaymentError("الشهر يجب أن يكون بين 01 و 12");
      return false;
    }
    
    // التحقق من السنة (مقارنة بالسنة الحالية)
    const currentYear = new Date().getFullYear() % 100; // آخر رقمين من السنة الحالية
    const year = parseInt(expiryDate.substring(3, 5));
    
    if (year < currentYear) {
      setPaymentError("البطاقة منتهية الصلاحية");
      return false;
    }
    
    // التحقق من رمز التحقق CVV (3-4 أرقام)
    if (!/^\d{3,4}$/.test(cvv)) {
      setPaymentError("رمز التحقق يجب أن يكون 3 أو 4 أرقام");
      return false;
    }
    
    // التحقق من اسم حامل البطاقة
    if (cardName.trim().length < 3) {
      setPaymentError("يرجى إدخال اسم حامل البطاقة بشكل صحيح");
      return false;
    }
    
    return true;
  };

  // معالجة تقديم نموذج الدفع
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    
    // التحقق من البيانات سيقوم بتعيين رسالة الخطأ تلقائياً
    if (!isValidCardDetails()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // في بيئة الإنتاج، هنا سيتم إرسال البيانات لواجهة برمجة تطبيقات ميسر
      // لكن لأغراض العرض التوضيحي سنقوم بمحاكاة نجاح عملية الدفع

      // نعتبر أن الدفع نجح إذا كان رقم البطاقة هو رقم الاختبار
      const isTestCard = cardNumber.replace(/\s+/g, '') === '4111111111111111';
      
      if (!isTestCard) {
        throw new Error("فشل الدفع. للتجربة، استخدم رقم البطاقة 4111111111111111");
      }

      // محاكاة تأخير الشبكة
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // إرسال معلومات الدفع إلى الخادم
      console.log("إرسال طلب دفع العربون للعرض رقم:", offer.id);
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
      console.log("استجابة دفع العربون:", data);
      
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
        description: "تم دفع العربون وكشف معلومات التواصل مع الشركة",
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
          <form onSubmit={handlePaymentSubmit}>
            <Card className="mb-4 border-2 border-primary/10">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center justify-between">
                  <span>بطاقة الدفع</span>
                  <CreditCard className="h-5 w-5 text-primary" />
                </CardTitle>
                <CardDescription>
                  أدخل بيانات بطاقتك لإتمام عملية الدفع
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName">الاسم على البطاقة</Label>
                  <Input 
                    id="cardName" 
                    placeholder="محمد عبدالله" 
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">رقم البطاقة</Label>
                  <Input 
                    id="cardNumber" 
                    placeholder="0000 0000 0000 0000" 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">تاريخ الانتهاء</Label>
                    <Input 
                      id="expiryDate" 
                      placeholder="MM/YY" 
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                      maxLength={5}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cvv">رمز التحقق (CVV)</Label>
                    <Input 
                      id="cvv" 
                      placeholder="123" 
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-primary/5 flex justify-between p-4">
                <div className="text-sm text-primary font-semibold">
                  المبلغ: {depositAmount} ريال سعودي
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الدفع...
                    </span>
                  ) : (
                    <span>إتمام الدفع</span>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="text-sm text-gray-500 mt-4 p-4 bg-gray-50 rounded-lg">
              <p>ملاحظة: سيتم خصم هذا المبلغ من القيمة الإجمالية للعقد مع الشركة.</p>
              <p className="mt-2 font-medium">بيانات بطاقة الاختبار: <span className="text-primary font-bold">4111111111111111</span>، أي تاريخ انتهاء مستقبلي، وأي رمز تحقق من ثلاثة أرقام.</p>
            </div>
          </form>
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