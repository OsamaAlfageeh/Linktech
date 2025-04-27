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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define our form schema
const registerSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب ويجب أن يكون أكثر من حرفين"),
  username: z.string().min(3, "اسم المستخدم مطلوب ويجب أن يكون أكثر من 3 أحرف"),
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  password: z.string().min(6, "كلمة المرور مطلوبة ويجب أن تكون أكثر من 6 أحرف"),
  role: z.enum(["entrepreneur", "company"], {
    invalid_type_error: "يرجى اختيار نوع الحساب",
    required_error: "نوع الحساب مطلوب",
  }),
  // Company profile fields (optional based on role)
  companyDescription: z.string().optional(),
  companySkills: z.string().optional(),
  companyWebsite: z.string().optional(),
  companyLocation: z.string().optional(),
}).refine(data => {
  // If role is company, companyDescription is required
  if (data.role === "company" && (!data.companyDescription || data.companyDescription.length < 10)) {
    return false;
  }
  return true;
}, {
  message: "وصف الشركة مطلوب ويجب أن يكون أكثر من 10 أحرف",
  path: ["companyDescription"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type RegisterProps = {
  auth: {
    login: (user: any) => void;
  };
};

const Register = ({ auth }: RegisterProps) => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [serverError, setServerError] = useState("");

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      role: "entrepreneur",
      companyDescription: "",
      companySkills: "",
      companyWebsite: "",
      companyLocation: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      const payload = {
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
      };

      // Add company profile data if role is company
      if (data.role === "company") {
        const skills = data.companySkills ? data.companySkills.split(",").map(s => s.trim()) : [];
        
        payload.companyProfile = {
          description: data.companyDescription || "",
          skills: skills,
          website: data.companyWebsite,
          location: data.companyLocation,
        };
      }

      const response = await apiRequest("POST", "/api/auth/register", payload);
      return response.json();
    },
    onSuccess: (data) => {
      auth.login(data.user);
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "مرحباً بك في منصة تِكلينك!",
      });

      // Redirect based on role
      if (data.user.role === "entrepreneur") {
        navigate("/dashboard/entrepreneur");
      } else {
        navigate("/dashboard/company");
      }
    },
    onError: (error: any) => {
      setServerError(error.message || "حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى.");
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    setServerError("");
    registerMutation.mutate(data);
  };

  const roleType = form.watch("role");

  return (
    <>
      <Helmet>
        <title>إنشاء حساب جديد | تِكلينك</title>
        <meta name="description" content="إنشاء حساب جديد في منصة تِكلينك للتواصل بين رواد الأعمال وشركات البرمجة" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md md:max-w-lg space-y-8 bg-white p-8 rounded-xl shadow-sm">
          <div className="text-center">
            <Link href="/">
              <span className="inline-block text-primary font-heading font-bold text-3xl mb-4">تِك<span className="text-accent">لينك</span></span>
            </Link>
            <h2 className="text-2xl font-bold font-heading">إنشاء حساب جديد</h2>
            <p className="mt-2 text-sm text-neutral-600">
              لديك حساب بالفعل؟{" "}
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>نوع الحساب</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="entrepreneur" id="entrepreneur" />
                            <FormLabel htmlFor="entrepreneur" className="font-normal cursor-pointer">
                              رائد أعمال (أبحث عن تنفيذ مشروع)
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="company" id="company" />
                            <FormLabel htmlFor="company" className="font-normal cursor-pointer">
                              شركة برمجة (أقدم خدمات برمجية)
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {roleType === "entrepreneur" ? "الاسم الكامل" : "اسم الشركة"}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={roleType === "entrepreneur" ? "أدخل اسمك الكامل" : "أدخل اسم الشركة"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="أدخل البريد الإلكتروني" {...field} />
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

                {roleType === "company" && (
                  <>
                    <FormField
                      control={form.control}
                      name="companyDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>وصف الشركة</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="قدم وصفاً مختصراً عن شركتك وخدماتها" 
                              {...field} 
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companySkills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>التخصصات والمهارات</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="مثال: تطبيقات الويب، تطبيقات الجوال، الذكاء الاصطناعي (مفصولة بفواصل)" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="companyWebsite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الموقع الإلكتروني</FormLabel>
                            <FormControl>
                              <Input placeholder="example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="companyLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الموقع الجغرافي</FormLabel>
                            <FormControl>
                              <Input placeholder="مثال: الرياض، السعودية" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </div>

              <Button
                type="submit"
                className="w-full hover-button-scale transition-all duration-300 hover:shadow-lg"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>جاري إنشاء الحساب...</span>
                  </div>
                ) : (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="ml-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    إنشاء حساب
                  </span>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm text-neutral-500">
            بإنشاء حساب، فإنك توافق على{" "}
            <Link href="#" className="text-primary hover:text-primary-dark link-underline">
              شروط الخدمة
            </Link>{" "}
            و{" "}
            <Link href="#" className="text-primary hover:text-primary-dark link-underline">
              سياسة الخصوصية
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
