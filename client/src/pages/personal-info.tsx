import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// استخدام مكون المصادقة من التطبيق
import { useAuth } from "../App";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Info, 
  CheckCircle, 
  ArrowRight,
  UserCheck,
  Loader2
} from "lucide-react";

// نموذج البيانات الشخصية
const personalInfoSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل مطلوب (3 أحرف على الأقل)"),
  nationalId: z.string().min(10, "رقم الهوية الوطنية مطلوب (10 أرقام على الأقل)"),
  phone: z.string().min(10, "رقم الجوال مطلوب (10 أرقام على الأقل)"),
  birthDate: z.string().min(1, "تاريخ الميلاد مطلوب"),
  address: z.string().min(10, "العنوان الوطني مطلوب (10 أحرف على الأقل)"),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

const PersonalInfoPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const auth = useAuth();
  const [successfulSubmit, setSuccessfulSubmit] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  
  // قراءة معلمة returnUrl من عنوان URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const returnUrlParam = searchParams.get('returnUrl');
    if (returnUrlParam) {
      setReturnUrl(returnUrlParam);
    }
  }, []);
  
  // استعلام عن ملف الشركة
  const {
    data: profile,
    isLoading: isLoadingProfile,
    refetch: refetchProfile
  } = useQuery<any>({
    queryKey: [`/api/companies/user/${auth.user?.id}`],
    enabled: !!auth.user?.id,
    staleTime: 0, // دائماً اعتبر البيانات قديمة لضمان التحديث عند الطلب
  });
  
  // نموذج البيانات الشخصية
  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: "",
      nationalId: "",
      phone: "",
      birthDate: "",
      address: "",
    },
  });
  
  // ضبط قيم النموذج إذا تم تحميل البيانات الشخصية
  useEffect(() => {
    if (profile) {
      form.setValue("fullName", profile.fullName || "");
      form.setValue("nationalId", profile.nationalId || "");
      form.setValue("phone", profile.phone || "");
      form.setValue("birthDate", profile.birthDate || "");
      form.setValue("address", profile.address || "");
    }
  }, [profile, form]);
  
  // تحديث البيانات الشخصية
  const updatePersonalInfoMutation = useMutation({
    mutationFn: async (data: PersonalInfoFormValues) => {
      if (!profile?.id) throw new Error("Profile ID is missing");
      
      console.log('Sending personal info update to server:', JSON.stringify(data));
      
      // نستخدم نفس نقطة النهاية لتحديث ملف الشركة ولكن نضيف البيانات الشخصية
      const response = await apiRequest("PATCH", `/api/companies/${profile.id}`, data);
      const result = await response.json();
      console.log('Server response:', JSON.stringify(result));
      return result;
    },
    onSuccess: async (data) => {
      console.log('تم استلام بيانات شخصية محدثة من الخادم:', JSON.stringify(data));
      
      // تحديث البيانات في الكاش
      queryClient.setQueryData([`/api/companies/user/${auth.user?.id}`], (oldData: any) => {
        return { ...oldData, ...data };
      });
      
      // إعادة تحميل البيانات
      await refetchProfile();
      
      toast({
        title: "تم تحديث البيانات الشخصية بنجاح",
        description: "تم تحديث بياناتك الشخصية المطلوبة لاتفاقيات عدم الإفصاح بنجاح.",
      });
      
      // تعيين حالة النجاح
      setSuccessfulSubmit(true);
      
      // انتظار ثم توجيه المستخدم إلى الصفحة التي جاء منها (إذا كانت موجودة) أو إلى لوحة التحكم
      setTimeout(() => {
        if (returnUrl) {
          navigate(returnUrl);
        } else {
          navigate("/dashboard/company");
        }
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من تحديث البيانات الشخصية، يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PersonalInfoFormValues) => {
    updatePersonalInfoMutation.mutate(data);
  };
  
  // التحقق من الصلاحيات
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.isCompany) {
      navigate("/");
    }
  }, [auth, navigate]);
  
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-neutral-600">جاري تحميل البيانات...</p>
      </div>
    );
  }
  
  if (!auth.isAuthenticated || !auth.isCompany) {
    return null;
  }
  
  return (
    <>
      <Helmet>
        <title>استكمال البيانات الشخصية | لينكتك</title>
        <meta name="description" content="استكمال البيانات الشخصية المطلوبة لاتفاقيات عدم الإفصاح" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading mb-2">البيانات الشخصية</h1>
          <p className="text-neutral-600">استكمال البيانات الشخصية المطلوبة لاتفاقيات عدم الإفصاح</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>استكمال البيانات الشخصية</CardTitle>
                <CardDescription>هذه البيانات مطلوبة لتوقيع اتفاقيات عدم الإفصاح والمشاركة في المشاريع التي تتطلب ذلك</CardDescription>
              </CardHeader>
              <CardContent>
                {successfulSubmit ? (
                  <div className="py-8 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">تم استكمال البيانات بنجاح!</h3>
                    <p className="text-neutral-600 mb-6">
                      تم تحديث بياناتك الشخصية بنجاح، يمكنك الآن توقيع اتفاقيات عدم الإفصاح والمشاركة في المشاريع.
                    </p>
                    <Button 
                      onClick={() => {
                        if (returnUrl) {
                          navigate(returnUrl);
                        } else {
                          navigate("/dashboard/company");
                        }
                      }}
                      className="gap-2"
                    >
                      {returnUrl ? "العودة إلى صفحة المشروع" : "العودة إلى لوحة التحكم"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                          <Info className="h-5 w-5 ml-2 text-blue-600" />
                          البيانات الشخصية المطلوبة لاتفاقيات عدم الإفصاح
                        </h3>
                        <p className="text-blue-700 text-sm mb-0">
                          هذه البيانات تستخدم فقط في توقيع اتفاقيات عدم الإفصاح ولن يتم مشاركتها مع أي طرف ثالث.
                        </p>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الكامل</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="أدخل اسمك الكامل كما في الهوية" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="nationalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهوية الوطنية</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="أدخل رقم الهوية الوطنية" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الجوال</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="أدخل رقم الجوال (مثال: 05xxxxxxxx)" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ الميلاد</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العنوان الوطني</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="أدخل العنوان الوطني بالتفصيل" 
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit"
                          disabled={updatePersonalInfoMutation.isPending}
                          className="gap-2"
                        >
                          {updatePersonalInfoMutation.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          حفظ البيانات الشخصية
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>معلومات مهمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">الخصوصية والأمان</h3>
                    <p className="text-sm text-neutral-600">
                      نحرص على خصوصية بياناتك الشخصية ولن يتم مشاركتها إلا في اتفاقيات عدم الإفصاح الرسمية.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">لماذا نحتاج هذه البيانات؟</h3>
                    <p className="text-sm text-neutral-600">
                      هذه البيانات ضرورية لإكمال اتفاقيات عدم الإفصاح والتي تعتبر متطلباً قانونياً للمشاركة في بعض المشاريع.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">التحقق من البيانات</h3>
                    <p className="text-sm text-neutral-600">
                      يرجى التأكد من صحة ودقة البيانات المدخلة، حيث ستستخدم في وثائق قانونية رسمية.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default PersonalInfoPage;