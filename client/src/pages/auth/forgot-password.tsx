import { useState } from "react";
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
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define our form schema
const forgotPasswordSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const { toast } = useToast();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormValues) => {
      try {
        // ملاحظة: في الإنتاج، هذا سيتواصل مع API فعلي لإرسال رابط استعادة كلمة المرور
        // حالياً نحاكي استجابة ناجحة
        console.log("إرسال طلب استعادة كلمة المرور للبريد:", data.email);
        
        // هنا سيكون الاتصال الفعلي بالخادم API
        // const response = await apiRequest("POST", "/api/auth/forgot-password", data);
        // return await response.json();
        
        // محاكاة نجاح لأغراض العرض
        return { success: true };
      } catch (error) {
        console.error("خطأ أثناء إرسال طلب استعادة كلمة المرور:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: "تم إرسال طلب استعادة كلمة المرور",
        description: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك.",
      });
    },
    onError: (error: any) => {
      console.error("خطأ استعادة كلمة المرور:", error);
      setServerError("حدث خطأ أثناء محاولة استعادة كلمة المرور. الرجاء المحاولة مرة أخرى.");
      
      toast({
        title: "فشل في إرسال الطلب",
        description: "تعذر إرسال طلب استعادة كلمة المرور. يرجى التحقق من البريد الإلكتروني والمحاولة مرة أخرى.",
        variant: "destructive"
      });
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    setServerError("");
    forgotPasswordMutation.mutate(data);
  };

  return (
    <>
      <Helmet>
        <title>استعادة كلمة المرور | تِكلينك</title>
        <meta name="description" content="استعادة كلمة المرور لمنصة تِكلينك للتواصل بين رواد الأعمال وشركات البرمجة" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm">
          <div className="text-center">
            <Link href="/">
              <span className="inline-block text-primary font-heading font-bold text-3xl mb-4">تِك<span className="text-accent">لينك</span></span>
            </Link>
            <h2 className="text-2xl font-bold font-heading">استعادة كلمة المرور</h2>
            <p className="mt-2 text-sm text-neutral-600">
              تذكرت كلمة المرور؟{" "}
              <Link href="/auth/login" className="text-primary hover:text-primary-dark font-medium">
                تسجيل الدخول
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
          
          {success ? (
            <Alert className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>تم إرسال البريد الإلكتروني</AlertTitle>
              <AlertDescription className="text-green-600">
                تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك والضغط على الرابط لإعادة تعيين كلمة المرور الخاصة بك.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="text-sm text-neutral-600 mb-4">
                  أدخل بريدك الإلكتروني المسجل في حسابك وسنرسل لك رابطاً لإعادة تعيين كلمة المرور الخاصة بك.
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل بريدك الإلكتروني" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? "جاري الإرسال..." : "إرسال رابط الإعادة"}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-4 text-center text-sm text-neutral-500">
            <Link href="/" className="text-primary hover:text-primary-dark">
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;