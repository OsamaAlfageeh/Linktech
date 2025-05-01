import { Helmet } from "react-helmet";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";

// نموذج التحقق
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن يحتوي على حرفين على الأقل" }),
  email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صحيح" }),
  phone: z.string().optional(),
  subject: z.string().min(1, { message: "يرجى اختيار موضوع" }),
  message: z.string().min(10, { message: "الرسالة يجب أن تحتوي على 10 أحرف على الأقل" }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });
  
  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    // محاكاة إرسال البريد الإلكتروني
    try {
      // إضافة تأخير لمحاكاة طلب الشبكة
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "تم إرسال رسالتك بنجاح",
        description: "سنقوم بالرد عليك في أقرب وقت ممكن.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "حدث خطأ أثناء إرسال الرسالة",
        description: "يرجى المحاولة مرة أخرى لاحقاً.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>تواصل معنا | لينكتيك</title>
        <meta name="description" content="تواصل مع فريق لينكتيك للاستفسارات والدعم الفني وأي أسئلة متعلقة بمنصتنا" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">تواصل معنا</h1>
          <p className="text-neutral-600 text-center mb-12 text-lg">
            نحن هنا للإجابة على جميع استفساراتك ومساعدتك في أي وقت
          </p>
          
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* معلومات التواصل */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">معلومات التواصل</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">البريد الإلكتروني</h3>
                    <p className="text-neutral-600">info@linktech.sa</p>
                    <p className="text-neutral-600">support@linktech.sa</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">الهاتف</h3>
                    <p className="text-neutral-600">+966 53 123 4567</p>
                    <p className="text-neutral-600">+966 12 345 6789</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">العنوان</h3>
                    <p className="text-neutral-600">
                      واحة المعرفة، طريق الملك عبدالعزيز
                      <br />
                      جدة، المملكة العربية السعودية
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10">
                <h3 className="font-bold text-lg mb-4">ساعات العمل</h3>
                <div className="space-y-2 text-neutral-600">
                  <p>الأحد - الخميس: 9:00 صباحاً - 5:00 مساءً</p>
                  <p>الجمعة - السبت: مغلق</p>
                </div>
              </div>
            </div>
            
            {/* نموذج التواصل */}
            <div className="md:col-span-3 bg-white rounded-xl shadow-md p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">أرسل لنا رسالة</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الكامل</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل اسمك الكامل" {...field} />
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
                            <Input placeholder="أدخل بريدك الإلكتروني" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف (اختياري)</FormLabel>
                          <FormControl>
                            <Input placeholder="+966 5X XXX XXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الموضوع</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر موضوع الرسالة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">استفسار عام</SelectItem>
                              <SelectItem value="technical">الدعم الفني</SelectItem>
                              <SelectItem value="billing">الفواتير والمدفوعات</SelectItem>
                              <SelectItem value="partnership">الشراكات</SelectItem>
                              <SelectItem value="feedback">اقتراحات وملاحظات</SelectItem>
                              <SelectItem value="other">أخرى</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الرسالة</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="اكتب رسالتك هنا..." 
                            rows={6}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="ml-2 h-4 w-4" />
                        إرسال الرسالة
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
          
          {/* خريطة أو معلومات إضافية */}
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 text-center">
            <h2 className="text-2xl font-bold mb-6">الأسئلة الشائعة</h2>
            
            <div className="grid md:grid-cols-2 gap-6 text-right">
              <div>
                <h3 className="font-bold text-lg mb-2 text-primary">كيف يمكنني إنشاء حساب؟</h3>
                <p className="text-neutral-600">
                  يمكنك إنشاء حساب بسهولة من خلال الضغط على "إنشاء حساب" في القائمة العلوية واتباع الخطوات البسيطة.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2 text-primary">كم تبلغ رسوم استخدام المنصة؟</h3>
                <p className="text-neutral-600">
                  المنصة مجانية للتسجيل والبحث عن المشاريع. يتم خصم عمولة 10% فقط عند قبول أحد العروض وبدء المشروع.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2 text-primary">كيف يتم التواصل مع الشركات؟</h3>
                <p className="text-neutral-600">
                  يتم التواصل من خلال نظام المراسلة المدمج في المنصة. عند قبول العرض، يمكنك الحصول على معلومات التواصل المباشرة.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2 text-primary">كيف يمكنني الحصول على الدعم الفني؟</h3>
                <p className="text-neutral-600">
                  يمكنك التواصل معنا من خلال نموذج التواصل في هذه الصفحة، أو مراسلتنا مباشرة على البريد الإلكتروني support@linktech.sa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;