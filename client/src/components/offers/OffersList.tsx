import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle, AlertCircle, Clock, Banknote, CalendarDays, MessageSquare } from "lucide-react";
import { PaymentDialog } from "../offers/PaymentDialog";

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
  companyContactRevealed?: boolean;
}

interface OffersListProps {
  projectId: number;
  isOwner: boolean;
}

export function OffersList({ projectId, isOwner }: OffersListProps) {
  const { toast } = useToast();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // جلب العروض الخاصة بالمشروع
  const { data: offers, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/projects/${projectId}/offers`],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/offers`);
      if (!res.ok) {
        throw new Error("فشل جلب العروض");
      }
      return res.json();
    },
    enabled: Boolean(projectId), // تفعيل الاستعلام فقط عندما يكون هناك معرف للمشروع
    staleTime: 0, // جعل البيانات سريعة التقادم للحصول على أحدث البيانات دائماً
  });

  // قبول العرض
  const acceptOffer = async (offerId: number) => {
    try {
      const res = await apiRequest("PATCH", `/api/offers/${offerId}/accept`, {});
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل قبول العرض");
      }
      
      const data = await res.json();
      setSelectedOffer(data);
      
      // إذا كان العرض يتطلب دفع العربون، اعرض نافذة الدفع
      if (data.paymentRequired) {
        setShowPaymentDialog(true);
      }
      
      // تحديث قائمة العروض
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/offers`] });
      
      toast({
        title: "تم قبول العرض",
        description: data.paymentRequired 
          ? "الرجاء دفع العربون لاستكمال العملية"
          : "تم قبول العرض بنجاح",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "فشل قبول العرض",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  };

  // استعراض حالة العروض
  const renderStatus = (status: string, depositPaid: boolean) => {
    if (status === 'accepted' && depositPaid) {
      return <Badge className="bg-green-500">تم قبوله ودفع العربون</Badge>;
    }
    
    if (status === 'accepted') {
      return <Badge className="bg-yellow-500">مقبول - بانتظار الدفع</Badge>;
    }
    
    if (status === 'pending') {
      return <Badge variant="outline" className="text-blue-500 border-blue-500">قيد المراجعة</Badge>;
    }
    
    if (status === 'rejected') {
      return <Badge variant="destructive">مرفوض</Badge>;
    }
    
    return <Badge>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل العروض...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-10 text-destructive">
        <AlertCircle className="h-6 w-6 ml-2" />
        <span>حدث خطأ أثناء تحميل العروض</span>
      </div>
    );
  }

  // إذا لم تكن هناك عروض
  if (!offers || (Array.isArray(offers) && offers.length === 0)) {
    if (!isOwner) {
      // اعرض الإحصائيات إذا كانت متوفرة
      if (offers && 'count' in offers) {
        return (
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات العروض</CardTitle>
              <CardDescription>
                يوجد {offers.count || 0} عرض على هذا المشروع
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offers.minAmount && offers.maxAmount ? (
                <p className="text-lg font-medium">
                  تتراوح الأسعار بين {offers.minAmount} و {offers.maxAmount} ريال
                </p>
              ) : (
                <p>لا توجد معلومات عن الأسعار حتى الآن</p>
              )}
            </CardContent>
          </Card>
        );
      }
      
      return (
        <div className="text-center py-8">
          <p>لا يمكن عرض تفاصيل العروض إلا للشركات المقدمة للعروض أو لصاحب المشروع</p>
        </div>
      );
    }
    
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-xl">لا توجد عروض مقدمة على هذا المشروع حتى الآن</p>
        </CardContent>
      </Card>
    );
  }

  // عرض قائمة العروض
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">العروض المقدمة على المشروع</h2>
      
      <div className="grid gap-6">
        {Array.isArray(offers) && offers.map((offer) => (
          <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {offer.companyLogo && (
                    <Avatar className="h-10 w-10 ml-3">
                      <AvatarImage src={offer.companyLogo} alt={offer.companyName || ""} />
                      <AvatarFallback>{offer.companyName?.charAt(0) || "C"}</AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <CardTitle className="flex items-center">
                      {offer.companyName}
                      {offer.companyVerified && <CheckCircle className="text-primary h-4 w-4 mr-1" />}
                    </CardTitle>
                    {offer.companyRating && (
                      <div className="flex items-center mt-1">
                        <span className="ml-1">{offer.companyRating}</span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-sm ${i < Math.floor(offer.companyRating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  {renderStatus(offer.status, offer.depositPaid)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Banknote className="h-5 w-5 ml-2 text-primary" />
                  <span className="font-bold">قيمة العرض:</span>
                  <span className="mr-2">{offer.amount} ريال</span>
                </div>
                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 ml-2 text-primary" />
                  <span className="font-bold">مدة التنفيذ:</span>
                  <span className="mr-2">{offer.duration}</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">تفاصيل العرض:</h4>
                <p className="text-gray-700 whitespace-pre-line">{offer.description}</p>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 ml-1" />
                <span>تم تقديم العرض منذ {new Date(offer.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
            </CardContent>
            
            <Separator />
            
            {isOwner && offer.status === 'pending' && (
              <CardFooter className="flex justify-between p-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default">قبول العرض</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد قبول العرض</AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من قبول هذا العرض؟ سيتطلب ذلك دفع عربون قدره 2.5% من قيمة العرض ({parseInt(offer.amount.replace(/[^0-9]/g, '')) * 0.025} ريال).
                        <br />
                        <br />
                        بعد قبول العرض ودفع العربون، ستتمكن من رؤية معلومات التواصل مع الشركة.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => acceptOffer(offer.id)}>
                        تأكيد القبول
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button variant="outline">
                  <MessageSquare className="ml-2 h-4 w-4" />
                  التواصل مع الشركة
                </Button>
              </CardFooter>
            )}
            
            {/* قسم العروض المقبولة مع الدفع - تم تعديله لتبسيط شرط العرض وضمان ظهور معلومات الشركة */}
            {offer.status === 'accepted' && offer.depositPaid && (
              <CardFooter className="p-4 bg-green-50">
                <div className="w-full">
                  <h4 className="font-bold text-green-700 mb-2">تم قبول هذا العرض</h4>
                  <p className="mb-4">
                    تم دفع العربون وكشف معلومات التواصل. يمكنك الآن التواصل مباشرة مع الشركة.
                  </p>
                  
                  {/* عرض معلومات التواصل مع الشركة - تم تحسين طريقة عرض المعلومات */}
                  <div className="p-4 rounded-lg bg-white border border-green-200 mt-2">
                    <div className="flex items-center mb-2">
                      <h5 className="font-bold text-green-800">معلومات التواصل:</h5>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <span className="font-semibold ml-2">الشركة:</span>
                        <span>{offer.companyName}</span>
                      </div>
                      {offer.companyEmail && (
                        <div className="flex items-center">
                          <span className="font-semibold ml-2">البريد الإلكتروني:</span>
                          <a href={`mailto:${offer.companyEmail}`} className="text-primary hover:underline">
                            {offer.companyEmail}
                          </a>
                        </div>
                      )}
                      {offer.companyUsername && (
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => window.location.href = `/messages?userId=${offer.companyUsername}`}
                          >
                            <MessageSquare className="ml-2 h-4 w-4" />
                            التواصل عبر الرسائل
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardFooter>
            )}
            
            {offer.status === 'accepted' && !offer.depositPaid && (
              <CardFooter className="p-4 bg-yellow-50">
                <div className="w-full flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-yellow-700">مطلوب دفع العربون</h4>
                    <p>يرجى دفع العربون لاستكمال العملية وكشف معلومات التواصل</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedOffer(offer);
                      setShowPaymentDialog(true);
                    }}
                  >
                    دفع العربون
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
      
      {/* نافذة الدفع */}
      {selectedOffer && (
        <PaymentDialog
          isOpen={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false);
            // إعادة تحميل البيانات عند إغلاق النافذة أيضاً للتأكد من تحديث البيانات
            refetch();
          }}
          offer={selectedOffer}
          onPaymentSuccess={() => {
            // إلغاء التخزين المؤقت وإعادة تحميل البيانات فوراً
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/offers`] });
            setTimeout(() => {
              refetch();
            }, 500);
          }}
        />
      )}
    </div>
  );
}