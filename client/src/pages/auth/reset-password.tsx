import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema validation for password reset
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .max(100, "كلمة المرور طويلة جداً"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // تحميل نموذج إعادة تعيين كلمة المرور
  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  // التحقق من صحة رمز إعادة التعيين
  useEffect(() => {
    if (!token) {
      setError("رمز إعادة التعيين غير صالح");
      setIsLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await apiRequest("GET", `/api/auth/reset-password/${token}`);
        const data = await response.json();

        if (data.valid) {
          setEmail(data.email);
          setError(null);
        } else {
          setError(data.message || "رمز إعادة التعيين غير صالح أو منتهي الصلاحية");
        }
      } catch (error) {
        console.error("خطأ في التحقق من رمز إعادة التعيين:", error);
        setError("حدثت مشكلة أثناء التحقق من رمز إعادة التعيين");
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // تنفيذ إعادة تعيين كلمة المرور
  async function onSubmit(data: ResetPasswordData) {
    if (!token) return;

    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", `/api/auth/reset-password/${token}`, {
        password: data.password
      });
      const result = await response.json();

      if (result.success) {
        setResetSuccess(true);
        toast({
          title: "تم إعادة تعيين كلمة المرور بنجاح",
          description: "يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة",
          variant: "default",
        });

        // انتظر 3 ثواني ثم انتقل إلى صفحة تسجيل الدخول
        setTimeout(() => {
          setLocation("/auth/login");
        }, 3000);
      } else {
        toast({
          title: "حدث خطأ",
          description: result.message || "فشل في إعادة تعيين كلمة المرور",
          variant: "destructive",
        });
        setError(result.message || "فشل في إعادة تعيين كلمة المرور");
      }
    } catch (error) {
      console.error("خطأ في إعادة تعيين كلمة المرور:", error);
      toast({
        title: "حدث خطأ",
        description: "فشلت عملية إعادة تعيين كلمة المرور",
        variant: "destructive",
      });
      setError("حدثت مشكلة أثناء إعادة تعيين كلمة المرور");
    } finally {
      setIsSubmitting(false);
    }
  }

  // عرض حالة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-slate-500">جاري التحقق من رمز إعادة التعيين...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض رسالة الخطأ
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-red-600">
              حدث خطأ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <Alert variant="destructive">
                <AlertTitle>خطأ في إعادة تعيين كلمة المرور</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="pt-4">
                <Link href="/auth/forgot-password">
                  <Button variant="outline" className="mr-2">
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    طلب رابط جديد
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="default">
                    العودة إلى تسجيل الدخول
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض رسالة النجاح
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-green-600">
              تم إعادة تعيين كلمة المرور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-slate-700">
                تم إعادة تعيين كلمة المرور الخاصة بك بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
              </p>
              <div className="pt-4">
                <Link href="/auth/login">
                  <Button variant="default" className="w-full">
                    الانتقال إلى صفحة تسجيل الدخول
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض نموذج إعادة تعيين كلمة المرور
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">
            إعادة تعيين كلمة المرور
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            {email ? `لـ ${email}` : "قم بإدخال كلمة المرور الجديدة"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">كلمة المرور الجديدة</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="• • • • • • • •"
                        type="password"
                        autoComplete="new-password"
                        className="border-slate-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">تأكيد كلمة المرور</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="• • • • • • • •"
                        type="password"
                        autoComplete="new-password"
                        className="border-slate-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  "إعادة تعيين كلمة المرور"
                )}
              </Button>
              <div className="text-center mt-4">
                <Link href="/auth/login">
                  <Button variant="link" className="text-primary px-0">
                    العودة إلى صفحة تسجيل الدخول
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}