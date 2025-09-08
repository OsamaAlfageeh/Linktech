import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// مخطط إعادة تعيين كلمة المرور
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "يجب أن تكون كلمة المرور 8 أحرف على الأقل" })
    .max(100, { message: "يجب أن تكون كلمة المرور 100 حرف كحد أقصى" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // التحقق من صلاحية الرمز عند تحميل الصفحة
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await apiRequest("GET", `/api/auth/reset-password/${token}`);
        const data = await response.json();
        
        if (response.ok && data.valid) {
          setIsTokenValid(true);
          setEmail(data.email);
        } else {
          setIsTokenValid(false);
          toast({
            title: "رمز غير صالح",
            description: "رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("خطأ في التحقق من الرمز:", error);
        setIsTokenValid(false);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء التحقق من صلاحية الرمز",
          variant: "destructive",
        });
      }
    };

    verifyToken();
  }, [token, toast]);

  async function onSubmit(data: ResetPasswordData) {
    if (!token) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", `/api/auth/reset-password/${token}`, {
        password: data.password,
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        toast({
          title: "تم بنجاح!",
          description: "تم إعادة تعيين كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول",
          variant: "default",
        });
        // التوجيه إلى صفحة تسجيل الدخول
        navigate("/auth/login");
      } else {
        toast({
          title: "فشل في إعادة تعيين كلمة المرور",
          description: responseData.message || "حدث خطأ أثناء إعادة تعيين كلمة المرور",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("خطأ في إرسال طلب إعادة تعيين كلمة المرور:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إعادة تعيين كلمة المرور",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isTokenValid === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-gray-600">جاري التحقق من صلاحية الرمز...</p>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-red-600">رمز غير صالح</CardTitle>
            <CardDescription className="text-center">
              رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button 
              variant="default" 
              onClick={() => navigate("/auth/forgot-password")}
            >
              طلب رمز جديد
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">إعادة تعيين كلمة المرور</CardTitle>
          <CardDescription className="text-center">
            {email && `للحساب: ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور الجديدة</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="أدخل كلمة المرور الجديدة" 
                        type="password" 
                        className="text-right"
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
                    <FormLabel>تأكيد كلمة المرور</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="أدخل كلمة المرور مرة أخرى" 
                        type="password" 
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري إعادة تعيين كلمة المرور...
                  </>
                ) : (
                  "إعادة تعيين كلمة المرور"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="link" 
            onClick={() => navigate("/auth/login")}
          >
            العودة إلى تسجيل الدخول
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}