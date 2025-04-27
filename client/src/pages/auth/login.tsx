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
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("user"); // "user" أو "admin"

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      auth.login(data.user);
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بعودتك، ${data.user.name}!`,
      });

      // Redirect based on role
      if (data.user.role === "admin") {
        navigate("/dashboard/admin");
      } else if (data.user.role === "entrepreneur") {
        navigate("/dashboard/entrepreneur");
      } else {
        navigate("/dashboard/company");
      }
    },
    onError: (error: any) => {
      setServerError("اسم المستخدم أو كلمة المرور غير صحيحة.");
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setServerError("");
    loginMutation.mutate(data);
  };

  return (
    <>
      <Helmet>
        <title>تسجيل الدخول | تِكلينك</title>
        <meta name="description" content="تسجيل الدخول إلى منصة تِكلينك للتواصل بين رواد الأعمال وشركات البرمجة" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm">
          <div className="text-center">
            <Link href="/">
              <span className="inline-block text-primary font-heading font-bold text-3xl mb-4">تِك<span className="text-accent">لينك</span></span>
            </Link>
            <h2 className="text-2xl font-bold font-heading">تسجيل الدخول</h2>
            <p className="mt-2 text-sm text-neutral-600">
              ليس لديك حساب؟{" "}
              <Link href="/auth/register" className="text-primary hover:text-primary-dark font-medium">
                إنشاء حساب
              </Link>
            </p>
          </div>
          
          <Tabs defaultValue="user" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">مستخدم</TabsTrigger>
              <TabsTrigger value="admin">
                <ShieldCheck className="inline-block ml-1 h-4 w-4" />
                مسؤول
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطأ</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          
          {activeTab === "admin" && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700 mb-2 font-medium">بيانات تسجيل دخول المسؤول:</p>
              <p className="text-xs text-blue-600 mb-1">اسم المستخدم: admin</p>
              <p className="text-xs text-blue-600">كلمة المرور: admin123</p>
            </div>
          )}

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
                  <Link href="#" className="text-primary hover:text-primary-dark font-medium">
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
            <Link href="#" className="text-primary hover:text-primary-dark">
              شروط الخدمة
            </Link>{" "}
            و{" "}
            <Link href="#" className="text-primary hover:text-primary-dark">
              سياسة الخصوصية
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
