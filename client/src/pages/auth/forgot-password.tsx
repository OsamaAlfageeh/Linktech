import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Mail, ArrowRight, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Schema validation for email
const forgotPasswordSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح")
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  async function onSubmit(data: ForgotPasswordData) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        
        // في وضع التطوير، قد يكون هناك رابط إعادة تعيين في الاستجابة
        if (result.resetLink) {
          setResetLink(result.resetLink);
          console.log("رابط إعادة التعيين للتطوير:", result.resetLink);
          
          toast({
            title: "تم إنشاء رابط إعادة تعيين كلمة المرور",
            description: "تم عرض الرابط في الصفحة (وضع التطوير فقط)",
            variant: "default",
          });
        } else {
          toast({
            title: "تم إرسال رابط إعادة تعيين كلمة المرور",
            description: "يرجى التحقق من بريدك الإلكتروني",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "حدث خطأ",
          description: result.message || "فشل في إرسال رابط إعادة تعيين كلمة المرور",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("خطأ في طلب إعادة تعيين كلمة المرور:", error);
      toast({
        title: "حدث خطأ",
        description: "فشل في إرسال طلب إعادة تعيين كلمة المرور",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">
            استعادة كلمة المرور
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              
              {resetLink ? (
                <>
                  <h3 className="text-lg font-medium text-slate-900">تم إنشاء رابط إعادة التعيين</h3>
                  <p className="text-slate-500">
                    في وضع التطوير، نعرض الرابط مباشرة هنا بدلاً من إرساله بالبريد الإلكتروني.
                  </p>
                  
                  <Alert className="bg-amber-50 border-amber-200 mt-4 mb-2 text-right">
                    <AlertDescription className="text-amber-800 text-sm">
                      ملاحظة: يظهر هذا الرابط فقط في بيئة التطوير.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-md text-left break-all">
                    <a 
                      href={resetLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-between"
                    >
                      <span className="text-sm">{resetLink}</span>
                      <ExternalLink className="h-4 w-4 flex-shrink-0 mr-1" />
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-slate-900">تم إرسال البريد الإلكتروني</h3>
                  <p className="text-slate-500">
                    لقد أرسلنا لك بريداً إلكترونياً يحتوي على رابط لإعادة تعيين كلمة المرور الخاصة بك.
                    يرجى التحقق من بريدك الإلكتروني.
                  </p>
                </>
              )}
              
              <div className="pt-4">
                <Link href="/auth/login">
                  <Button variant="link" className="text-primary">
                    العودة إلى صفحة تسجيل الدخول <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="email@example.com"
                          type="email"
                          autoComplete="email"
                          className="border-slate-300"
                          {...field}
                          dir="ltr"
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
                    "إرسال رابط إعادة التعيين"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}