import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RecommendedProjects } from "@/components/recommendations";
import { useAuth } from "@/App";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Globe, 
  MessageSquare, 
  AlertCircle,
  Lock,
  CreditCard,
  CheckCircle2
} from "lucide-react";

type CompanyProfile = {
  id: number;
  userId: number;
  description: string;
  logo?: string;
  coverPhoto?: string;
  website?: string;
  location?: string;
  skills: string[];
  rating?: number;
  reviewCount?: number;
  name?: string;
  email?: string;
  username?: string;
};

interface CompanyPaymentStatus {
  companyId: number;
  hasPaid: boolean;
  paymentDate?: string;
}

const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const companyId = parseInt(id);
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [hasPaid, setHasPaid] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const auth = useAuth();
  const isAdmin = auth?.user?.role === "admin";

  // فحص حالة الدفع للشركة عند تحميل الصفحة
  useEffect(() => {
    if (companyId) {
      // التحقق من وجود سجل للدفع في التخزين المحلي
      const savedPayments = localStorage.getItem('companyPayments');
      if (savedPayments) {
        const payments: CompanyPaymentStatus[] = JSON.parse(savedPayments);
        const companyPayment = payments.find(p => p.companyId === companyId);
        if (companyPayment) {
          setHasPaid(companyPayment.hasPaid);
        }
      }
    }
  }, [companyId]);

  const {
    data: company,
    isLoading,
    error,
  } = useQuery<CompanyProfile>({
    queryKey: [`/api/companies/${companyId}`],
    enabled: !!companyId && !isNaN(companyId),
  });
  
  // Check for invalid company ID
  useEffect(() => {
    if (!id || isNaN(parseInt(id))) {
      navigate("/not-found");
    }
  }, [id, navigate]);

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-amber-500 text-amber-500 h-5 w-5" />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
          <defs>
            <linearGradient id="halfFill">
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="url(#halfFill)" stroke="currentColor" />
        </svg>
      );
    }
    
    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-amber-500 h-5 w-5" />);
    }
    
    return stars;
  };

  const getCoverGradient = (id: number) => {
    const colors = [
      "from-blue-400 to-blue-600",
      "from-purple-400 to-purple-600",
      "from-green-400 to-green-600",
      "from-red-400 to-red-600",
      "from-indigo-400 to-indigo-600"
    ];
    
    return `bg-gradient-to-r ${colors[id % colors.length]}`;
  };
  
  // وظيفة معالجة الدفع
  const handlePayment = async () => {
    // للمسؤول، نمنح الوصول الفوري دون دفع
    if (isAdmin) {
      setHasPaid(true);
      setIsPaymentModalOpen(false);
      
      toast({
        title: "صلاحيات المسؤول",
        description: "لديك وصول كامل كمسؤول دون الحاجة للدفع",
      });
      
      return;
    }
    
    setPaymentProcessing(true);
    try {
      // في البيئة الحقيقية، سنرسل طلب إلى الخادم وننتظر استجابة ميسر
      // هنا نحاكي عملية دفع ناجحة لأغراض العرض التجريبي
      
      // محاكاة تأخير شبكة لمدة ثانية
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // تحديث حالة الدفع للشركة في التخزين المحلي
      savePaymentStatus(companyId, true);
      
      setHasPaid(true);
      setPaymentSuccess(true);
      setPaymentProcessing(false);
      
      toast({
        title: "تم الدفع بنجاح",
        description: "يمكنك الآن الوصول إلى معلومات التواصل كاملة",
      });
      
      // إغلاق نافذة الدفع بعد ثانيتين
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        setPaymentSuccess(false);
      }, 2000);
      
    } catch (error) {
      setPaymentProcessing(false);
      toast({
        title: "فشلت عملية الدفع",
        description: "يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني",
        variant: "destructive",
      });
    }
  };
  
  // وظيفة حفظ حالة الدفع في التخزين المحلي
  const savePaymentStatus = (companyId: number, paid: boolean) => {
    const now = new Date().toISOString();
    const savedPayments = localStorage.getItem('companyPayments');
    let payments: CompanyPaymentStatus[] = [];
    
    if (savedPayments) {
      payments = JSON.parse(savedPayments);
      // تحديث السجل الموجود أو إضافة سجل جديد
      const existingIndex = payments.findIndex(p => p.companyId === companyId);
      if (existingIndex >= 0) {
        payments[existingIndex] = { ...payments[existingIndex], hasPaid: paid, paymentDate: now };
      } else {
        payments.push({ companyId, hasPaid: paid, paymentDate: now });
      }
    } else {
      payments = [{ companyId, hasPaid: paid, paymentDate: now }];
    }
    
    localStorage.setItem('companyPayments', JSON.stringify(payments));
  };

  return (
    <>
      <Helmet>
        <title>{company ? `${company.name} | تِكلينك` : 'ملف الشركة | تِكلينك'}</title>
        <meta name="description" content={company?.description || 'ملف شركة البرمجة'} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/companies" className="text-primary hover:text-primary-dark inline-flex items-center">
            <ArrowLeft className="ml-1 h-4 w-4 rtl-flip" />
            العودة إلى الشركات
          </Link>
          
          {isAdmin && (
            <div className="mt-2 flex items-center text-primary font-medium">
              <Badge variant="outline" className="bg-primary/10 border-primary/25 text-primary ml-1">مشرف</Badge>
              عرض بصلاحيات المشرف - جميع المعلومات مكشوفة
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="relative px-6 md:px-8">
              <div className="absolute -top-16 right-8">
                <Skeleton className="w-32 h-32 rounded-xl" />
              </div>
              <div className="pt-20 pb-8">
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-5 w-1/4 mb-6" />
                <Skeleton className="h-20 w-full mb-6" />
                <div className="flex flex-wrap gap-2 mb-6">
                  <Skeleton className="h-7 w-24 rounded" />
                  <Skeleton className="h-7 w-20 rounded" />
                  <Skeleton className="h-7 w-28 rounded" />
                </div>
                <div className="flex flex-wrap gap-4 mb-6">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-6 w-40" />
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">لا يمكن تحميل بيانات الشركة</h2>
            <p className="text-neutral-600 mb-6">حدث خطأ أثناء محاولة تحميل بيانات الشركة. يرجى المحاولة مرة أخرى لاحقًا.</p>
            <Button onClick={() => window.location.reload()} variant="outline">إعادة المحاولة</Button>
          </div>
        ) : company ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Cover photo */}
            <div className={`w-full h-48 ${company.coverPhoto ? '' : getCoverGradient(company.id)}`}>
              {company.coverPhoto && (
                <img 
                  src={company.coverPhoto} 
                  alt={company.name || ''} 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Company details */}
            <div className="relative px-6 md:px-8">
              {/* Logo */}
              <div className="absolute -top-16 right-8">
                <div className="w-32 h-32 rounded-xl bg-white shadow-md flex items-center justify-center overflow-hidden p-2">
                  {company.logo ? (
                    <img 
                      src={company.logo} 
                      alt={company.name || ''} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center rounded-lg ${getCoverGradient(company.id)} text-white text-4xl font-bold`}>
                      {company.name?.charAt(0) || ''}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-20 pb-8">
                {/* Company name and rating */}
                <div className="mb-6 relative">
                  <div className={!hasPaid && !isAdmin ? "blur-sm select-none" : ""}>
                    <h1 className="text-3xl font-bold font-heading mb-2">{company.name}</h1>
                    <div className="flex items-center">
                      <div className="flex items-center text-amber-500 ml-2">
                        {renderStars(company.rating)}
                      </div>
                      <span className="text-neutral-600">
                        ({company.rating?.toFixed(1)}) - {company.reviewCount} مراجعة
                      </span>
                    </div>
                  </div>
                  
                  {/* قفل اسم الشركة */}
                  {!hasPaid && !isAdmin && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/80 rounded-lg p-2 shadow-sm border flex items-center">
                        <Lock className="text-primary h-4 w-4 ml-1" />
                        <span className="text-xs font-medium">اسم الشركة محمي</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-8">
                  <p className="text-neutral-700 whitespace-pre-line">{company.description}</p>
                </div>

                {/* Admin indicator */}
                {isAdmin && (
                  <div className="mb-4 p-2 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="font-medium">أنت تتصفح هذه الصفحة بصلاحيات المسؤول - كل المعلومات مرئية</span>
                    </div>
                  </div>
                )}

                {/* Skills */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold font-heading mb-3">التخصصات</h2>
                  <div className="flex flex-wrap gap-2">
                    {company.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-lg">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Contact details */}
                <div className="relative mb-6">
                  <div className={`flex flex-col md:flex-row md:items-center gap-4 md:gap-6 ${!hasPaid && !isAdmin ? "blur-sm select-none" : ""}`}>
                    {company.location && (
                      <div className="flex items-center text-neutral-700">
                        <MapPin className="ml-1 h-5 w-5 text-neutral-500" />
                        <span>{company.location}</span>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center text-neutral-700">
                        <Globe className="ml-1 h-5 w-5 text-neutral-500" />
                        <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className={`text-primary hover:underline ${!hasPaid && !isAdmin ? "pointer-events-none" : ""}`}>
                          {company.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-center text-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{company.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* قفل معلومات الاتصال */}
                  {!hasPaid && !isAdmin && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/80 rounded-lg p-4 shadow-sm border flex flex-col items-center">
                        <Lock className="text-primary h-6 w-6 mb-2" />
                        <p className="text-sm font-medium mb-2">معلومات التواصل محمية</p>
                        <Button onClick={() => setIsPaymentModalOpen(true)} size="sm" className="flex items-center">
                          <CreditCard className="ml-1 h-4 w-4" />
                          <span>ادفع للوصول</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact button */}
                <div className="mt-6">
                  <Button 
                    onClick={() => {
                      // التحقق من تسجيل الدخول قبل الانتقال إلى صفحة الدردشة
                      fetch('/api/auth/user')
                        .then(res => {
                          if (res.status === 200) {
                            // المستخدم مسجل الدخول، الانتقال إلى صفحة الدردشة
                            navigate(`/messages?userId=${company.userId}`);
                          } else {
                            // المستخدم غير مسجل، توجيهه إلى صفحة تسجيل الدخول
                            toast({
                              title: "تسجيل الدخول مطلوب",
                              description: "يجب تسجيل الدخول أولاً للتواصل مع الشركة",
                            });
                            navigate("/auth/login");
                          }
                        })
                        .catch(() => {
                          // في حالة حدوث خطأ، توجيهه إلى صفحة تسجيل الدخول
                          navigate("/auth/login");
                        });
                    }} 
                    className="w-full md:w-auto"
                  >
                    <MessageSquare className="ml-2 h-4 w-4" />
                    تواصل مع الشركة
                  </Button>
                </div>
                
                {/* نافذة الدفع */}
                <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                  <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>ادفع للوصول إلى معلومات الشركة</DialogTitle>
                      <DialogDescription>
                        بعد إتمام عملية الدفع، ستتمكن من الاطلاع على معلومات التواصل الخاصة بالشركة.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-6">
                      {paymentSuccess ? (
                        <div className="text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-neutral-900 mb-1">تم الدفع بنجاح</h3>
                          <p className="text-neutral-600 mb-4">يمكنك الآن الوصول إلى كافة معلومات التواصل</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">عمولة الوصول</span>
                              <span className="font-bold">50 ريال</span>
                            </div>
                            <p className="text-sm text-neutral-600">تتيح لك هذه العمولة الوصول المباشر إلى معلومات التواصل الخاصة بالشركة والتواصل معها خارج المنصة.</p>
                          </div>
                          
                          <div className="border rounded-lg p-4">
                            <div className="text-center">
                              <img src="https://moyasar.com/static/moyasar-sticker.png" alt="Moyasar logo" className="h-6 mx-auto mb-4" />
                              
                              <div className="bg-neutral-50 rounded-lg p-3 border flex items-center mb-4">
                                <div className="w-12 h-8 bg-[#1A1F71] rounded flex items-center justify-center ml-2">
                                  <span className="text-white font-bold text-xs">VISA</span>
                                </div>
                                <span className="text-neutral-600">**** **** **** 4242</span>
                              </div>
                              
                              <Button 
                                onClick={handlePayment} 
                                disabled={paymentProcessing} 
                                className="w-full"
                              >
                                {paymentProcessing ? (
                                  <div className="flex items-center">
                                    <svg className="animate-spin ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>جاري إتمام الدفع...</span>
                                  </div>
                                ) : (
                                  <span>إتمام الدفع - 50 ريال</span>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter>
                      {!paymentSuccess && (
                        <Button variant="outline" disabled={paymentProcessing} onClick={() => setIsPaymentModalOpen(false)}>
                          إلغاء
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">لم يتم العثور على الشركة</h2>
            <p className="text-neutral-600 mb-6">لا يمكن العثور على الشركة المطلوبة. قد يكون تم حذفها أو أن الرابط غير صحيح.</p>
            <Link href="/companies">
              <Button>عرض جميع الشركات</Button>
            </Link>
          </div>
        )}

        {/* Recommended Projects */}
        {company && (
          <div className="mt-10">
            <RecommendedProjects companyId={company.id} limit={3} />
          </div>
        )}
      </div>
    </>
  );
};

export default CompanyDetails;
