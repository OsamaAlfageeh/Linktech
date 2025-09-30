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
import { Mail, Phone, MapPin, Send, Loader2, ArrowLeft, MessageCircle, Clock } from "lucide-react";
import SEO from "@/components/seo/SEO";
import { WebpageStructuredData, BreadcrumbStructuredData } from "@/components/seo/StructuredData";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

import { insertContactMessageSchema } from "@shared/schema";

// نموذج التحقق مع امتداد لإضافة الموضوع (subject)
const contactFormSchema = insertContactMessageSchema.extend({
  subject: z.string().min(1, { message: "يرجى اختيار موضوع" }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلب معلومات التواصل من الإعدادات
  const { data: contactInfo, isLoading: isLoadingContactInfo, refetch: refetchContactInfo } = useQuery({
    queryKey: ['/api/contact-info'],
    queryFn: async () => {
      console.log('جلب معلومات التواصل...');
      const response = await fetch('/api/contact-info');
      if (!response.ok) {
        throw new Error('فشل في جلب معلومات التواصل');
      }
      const data = await response.json();
      console.log('معلومات التواصل المستلمة:', data);
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: false, // منع التحديث التلقائي
    staleTime: 1000 * 60 * 5, // البيانات تبقى صالحة لمدة 5 دقائق
    refetchOnMount: true, // تحديث عند تحميل الصفحة
    refetchInterval: false // إيقاف التحديث التلقائي
  });
  
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
    
    // إعداد بيانات الرسالة للإرسال إلى API
    const contactData = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
      // تخزين الموضوع كجزء من الرسالة
      messageDetails: {
        subject: data.subject
      }
    };
    
    try {
      // إرسال البيانات إلى نقطة نهاية API
      const response = await fetch('/api/contact-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'حدث خطأ أثناء إرسال الرسالة');
      }
      
      toast({
        title: "تم إرسال رسالتك بنجاح",
        description: "سنقوم بالرد عليك في أقرب وقت ممكن.",
      });
      
      form.reset();
    } catch (error) {
      console.error('خطأ في إرسال نموذج الاتصال:', error);
      toast({
        title: "حدث خطأ أثناء إرسال الرسالة",
        description: error instanceof Error ? error.message : "يرجى المحاولة مرة أخرى لاحقاً.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <SEO
        title="تواصل معنا | لينكتك"
        description="تواصل مع فريق لينكتك للاستفسارات والدعم الفني وأي أسئلة متعلقة بمنصتنا"
        keywords="تواصل معنا, دعم فني, اتصل بنا, لينكتك, المساعدة, استفسارات"
      >
        <WebpageStructuredData
          name="تواصل معنا | لينكتك"
          description="تواصل مع فريق لينكتك للاستفسارات والدعم الفني وأي أسئلة متعلقة بمنصتنا"
          url="https://linktech.app/contact"
        />
        <BreadcrumbStructuredData
          items={[
            { name: "الرئيسية", url: "https://linktech.app/" },
            { name: "تواصل معنا", url: "https://linktech.app/contact" }
          ]}
        />
      </SEO>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:text-primary-dark inline-flex items-center">
            <ArrowLeft className="ml-1 h-4 w-4 rtl-flip" />
            العودة إلى الرئيسية
          </Link>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <nav className="flex text-sm text-neutral-600 mb-6" aria-label="التنقل التسلسلي">
            <ol className="flex rtl space-x-2 space-x-reverse">
              <li><Link href="/" className="hover:text-primary hover:underline">الرئيسية</Link></li>
              <li className="before:content-['/'] before:mx-2 font-semibold">تواصل معنا</li>
            </ol>
          </nav>
          
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">تواصل معنا</h1>
          <p className="text-neutral-600 text-center mb-12 text-lg">
            نحن هنا للإجابة على جميع استفساراتك ومساعدتك في أي وقت
          </p>
          
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* معلومات التواصل */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">معلومات التواصل</h2>
              
              {isLoadingContactInfo ? (
                <div className="space-y-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">البريد الإلكتروني</h3>
                      <p className="text-neutral-600">
                        {contactInfo?.contact_email || 'info@linktech.app'}
                      </p>
                      {contactInfo?.support_email && (
                        <p className="text-neutral-600">{contactInfo.support_email}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">الهاتف</h3>
                      <a 
                        href={`https://wa.me/${(contactInfo?.contact_phone || '+966558230663').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-600 hover:text-primary transition-colors cursor-pointer" 
                        dir="ltr"
                      >
                        {contactInfo?.contact_phone || '+966 53 123 4567'}
                      </a>
                      {contactInfo?.secondary_phone && (
                        <a 
                          href={`https://wa.me/${contactInfo.secondary_phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-600 hover:text-primary transition-colors cursor-pointer block" 
                          dir="ltr"
                        >
                          {contactInfo.secondary_phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {contactInfo?.contact_whatsapp && (
                    <div className="flex items-start gap-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <MessageCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">واتساب</h3>
                        <p className="text-neutral-600" dir="ltr">
                          {contactInfo.contact_whatsapp}
                        </p>
                        <p className="text-sm text-neutral-500">للتواصل السريع</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">العنوان</h3>
                      <p className="text-neutral-600">
                        {contactInfo?.contact_address || 
                         'واحة المعرفة، طريق الملك عبدالعزيز، جدة، المملكة العربية السعودية'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-10">
                <h3 className="font-bold text-lg mb-4">ساعات العمل</h3>
                <div className="space-y-2 text-neutral-600">
                  {contactInfo?.business_hours ? (
                    <p>{contactInfo.business_hours}</p>
                  ) : (
                    <>
                      <p>الأحد - الخميس: 9:00 صباحاً - 5:00 مساءً</p>
                      <p>الجمعة - السبت: مغلق</p>
                    </>
                  )}
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
                  المنصة مجانية للتسجيل والبحث عن المشاريع. يتم خصم عمولة 2.5% فقط عند قبول أحد العروض وبدء المشروع.
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
                  يمكنك التواصل معنا من خلال نموذج التواصل في هذه الصفحة، أو مراسلتنا مباشرة على البريد الإلكتروني support@linktech.app.
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