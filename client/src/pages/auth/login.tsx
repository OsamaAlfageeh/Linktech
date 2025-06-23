import { useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
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
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// إزالة استيراد مكتبات علامات التبويب
import { Badge } from "@/components/ui/badge";

// Define our form schema
const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginProps = {
  auth: {
    login: (user: any) => void;
  };
};

const Login = ({ auth }: LoginProps) => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [serverError, setServerError] = useState("");
  const [data, setData] = useState<any>(null);
  // واجهة تسجيل دخول موحدة

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "admin",
      password: "admin123",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      try {
        console.log("محاولة تسجيل الدخول للمستخدم:", data.username);
        const response = await apiRequest("POST", "/api/auth/login", data);
        
        if (!response.ok) {
          // للتعامل مع أخطاء HTTP بشكل صحيح
          const errorData = await response.json();
          throw new Error(errorData.message || "فشل تسجيل الدخول");
        }
        
        return await response.json();
      } catch (error) {
        console.error("خطأ أثناء تسجيل الدخول:", error);
        throw error;
      }
    },
    onSuccess: (responseData) => {
      console.log("تسجيل دخول ناجح، البيانات المستلمة:", responseData);
      
      // تحسين استخراج بيانات المستخدم
      if (!responseData || (!responseData.user && !responseData.username)) {
        console.error("خطأ: البيانات المستلمة غير صالحة:", responseData);
        toast({
          title: "خطأ في النظام",
          description: "تم تسجيل الدخول ولكن البيانات المستلمة غير صالحة.",
          variant: "destructive"
        });
        return;
      }
      
      // استخراج بيانات المستخدم من الاستجابة بشكل صحيح
      const userData = responseData.user || responseData;
      setData(responseData);
      
      console.log("بيانات المستخدم المستخرجة:", userData);
      
      // عرض رسالة نجاح
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بعودتك، ${userData.name || userData.username}!`,
      });
      
      // تنظيف ذاكرة التخزين المؤقت وإعادة تحميل البيانات
      import("@/lib/queryClient").then(({ queryClient }) => {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        queryClient.refetchQueries({ queryKey: ['/api/auth/user'] });
        
        // تحديث حالة المصادقة بعد تنظيف ذاكرة التخزين المؤقت
        auth.login(userData);
        
        // توجيه المستخدم حسب دوره
        const role = userData.role;
        console.log("توجيه المستخدم بدور:", role);
        
        // استخدام setTimeout لضمان تحديث الحالة أولاً
        setTimeout(() => {
          if (role === "admin") {
            console.log("بدء التوجيه للوحة المسؤول...");
            navigate("/dashboard/admin");
          } else if (role === "entrepreneur") {
            console.log("بدء التوجيه لداشبورد ريادي الأعمال...");
            navigate("/dashboard/entrepreneur");
          } else if (role === "company") {
            console.log("بدء التوجيه لداشبورد الشركة...");
            navigate("/dashboard/company");
          } else {
            console.log("دور غير معروف، التوجيه إلى الصفحة الرئيسية");
            navigate("/");
          }
        }, 1000);
      });
    },
    onError: (error: any) => {
      console.error("خطأ تسجيل الدخول:", error);
      setServerError("اسم المستخدم أو كلمة المرور غير صحيحة. الرجاء المحاولة مرة أخرى.");
      
      toast({
        title: "فشل تسجيل الدخول",
        description: "تعذر تسجيل الدخول بالبيانات المدخلة. الرجاء التحقق والمحاولة مرة أخرى.",
        variant: "destructive"
      });
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setServerError("");
    loginMutation.mutate(data);
  };

  return (
    <>
      <Helmet>
        <title>تسجيل الدخول | لينكتك</title>
        <meta name="description" content="تسجيل الدخول إلى منصة لينكتك للتواصل بين رواد الأعمال وشركات البرمجة" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm">
          <div className="text-center">
            <Link href="/">
              <span className="inline-block text-primary font-heading font-bold text-3xl mb-4">لينك<span className="text-accent">تك</span></span>
            </Link>
            <h2 className="text-2xl font-bold font-heading">تسجيل الدخول</h2>
            <p className="mt-2 text-sm text-neutral-600">
              ليس لديك حساب؟{" "}
              <Link href="/auth/register" className="text-primary hover:text-primary-dark font-medium">
                إنشاء حساب
              </Link>
            </p>
          </div>
          
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطأ</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          
          <div className="mt-2 mb-3 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-700 mb-1 font-medium">معلومات هامة:</p>
            <p className="text-xs text-blue-600 mb-2">سيتم توجيهك تلقائياً حسب نوع حسابك بعد تسجيل الدخول</p>
            {data?.user && data.user.role === "admin" && (
              <div className="mt-2">
                <p className="text-xs text-blue-700 mb-1">تم تسجيل دخولك كمسؤول، اضغط هنا للوصول إلى لوحة التحكم:</p>
                <Link 
                  href="/dashboard/admin" 
                  className="block w-full text-center bg-primary text-white text-xs py-2 px-3 rounded-lg hover:bg-primary-dark"
                >
                  لوحة تحكم المسؤول
                </Link>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المستخدم" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link href="/auth/forgot-password" className="text-primary hover:text-primary-dark font-medium">
                    نسيت كلمة المرور؟
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm text-neutral-500">
            بتسجيل الدخول، فإنك توافق على{" "}
            <Link href="/terms" className="text-primary hover:text-primary-dark">
              شروط الخدمة
            </Link>{" "}
            و{" "}
            <Link href="/privacy" className="text-primary hover:text-primary-dark">
              سياسة الخصوصية
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
