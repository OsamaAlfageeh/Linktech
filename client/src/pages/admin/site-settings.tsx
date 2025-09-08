import { useState, useEffect } from "react";
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
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Save, Loader2, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// نموذج التحقق لإعدادات التواصل
const contactSettingsSchema = z.object({
  email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صحيح" }),
  phone: z.string().min(1, { message: "يرجى إدخال رقم الهاتف" }),
  address: z.string().min(1, { message: "يرجى إدخال العنوان" }),
  whatsapp: z.string().optional(),
  businessHours: z.string().optional(),
});

type ContactSettingsValues = z.infer<typeof contactSettingsSchema>;

const SiteSettingsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ContactSettingsValues>({
    resolver: zodResolver(contactSettingsSchema),
    defaultValues: {
      email: "",
      phone: "",
      address: "",
      whatsapp: "",
      businessHours: "",
    },
  });

  // جلب الإعدادات الحالية
  const { data: settings, isLoading: isLoadingSettings, error: settingsError } = useQuery({
    queryKey: ['/api/admin/site-settings'],
    queryFn: async () => {
      console.log('جلب إعدادات الموقع...');
      const response = await fetch('/api/admin/site-settings', {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('يرجى تسجيل الدخول كمدير');
        }
        throw new Error('فشل في جلب الإعدادات');
      }
      const data = await response.json();
      console.log('إعدادات الموقع المستلمة:', data);
      return data;
    },
    retry: 1,
  });

  // تحديث القيم عند جلب الإعدادات
  useEffect(() => {
    if (settings && Array.isArray(settings)) {
      console.log('تحديث نموذج الإعدادات:', settings);
      
      const settingsMap = settings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      console.log('خريطة الإعدادات:', settingsMap);

      const formData = {
        email: settingsMap.contact_email || "",
        phone: settingsMap.contact_phone || "",
        address: settingsMap.contact_address || "",
        whatsapp: settingsMap.contact_whatsapp || "",
        businessHours: settingsMap.business_hours || "",
      };

      console.log('بيانات النموذج المحدثة:', formData);
      form.reset(formData);
    }
  }, [settings, form]);

  // طفرة لحفظ الإعدادات
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: ContactSettingsValues) => {
      const settingsToUpdate = [
        { key: 'contact_email', value: data.email, description: 'البريد الإلكتروني للتواصل', category: 'contact' },
        { key: 'contact_phone', value: data.phone, description: 'رقم الهاتف للتواصل', category: 'contact' },
        { key: 'contact_address', value: data.address, description: 'عنوان الشركة', category: 'contact' },
        { key: 'contact_whatsapp', value: data.whatsapp || '', description: 'رقم الواتساب', category: 'contact' },
        { key: 'business_hours', value: data.businessHours || '', description: 'ساعات العمل', category: 'contact' },
      ];

      // حفظ في نظام الإعدادات العام
      const response1 = await fetch('/api/admin/site-settings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsToUpdate }),
      });

      // حفظ إعدادات التواصل في قاعدة البيانات
      const contactSettings = [
        { category: 'contact', key: 'contact_email', value: data.email },
        { category: 'contact', key: 'contact_phone', value: data.phone },
        { category: 'contact', key: 'contact_address', value: data.address },
        { category: 'contact', key: 'contact_whatsapp', value: data.whatsapp || '' },
        { category: 'contact', key: 'business_hours', value: data.businessHours }
      ];

      // حفظ إعدادات التواصل كدفعة واحدة
      const contactResponse = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ settings: contactSettings }),
      });

      if (!response1.ok || !contactResponse.ok) {
        throw new Error('فشل في حفظ الإعدادات');
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "تم حفظ الإعدادات بنجاح",
        description: "تم تحديث معلومات التواصل بنجاح",
      });
      // إعادة تحديث كاش الإعدادات ومعلومات التواصل
      queryClient.invalidateQueries({ queryKey: ['/api/admin/site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contact-info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contact-info'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ContactSettingsValues) => {
    setIsLoading(true);
    try {
      await saveSettingsMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>جاري تحميل الإعدادات...</span>
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">خطأ في تحميل الإعدادات</p>
          <p className="text-gray-600 mb-4">{settingsError instanceof Error ? settingsError.message : 'حدث خطأ غير متوقع'}</p>
          <Button onClick={() => window.location.reload()}>إعادة تحميل الصفحة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="h-8 w-8 ml-3" />
            إعدادات الموقع
          </h1>
          <p className="mt-2 text-gray-600">
            إدارة معلومات التواصل والإعدادات العامة للموقع
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 ml-2" />
              معلومات التواصل
            </CardTitle>
            <CardDescription>
              قم بتحديث معلومات التواصل التي ستظهر للزوار في الموقع
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Mail className="h-4 w-4 ml-2" />
                          البريد الإلكتروني *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="admin@linktech.sa"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormDescription>
                          البريد الإلكتروني الرئيسي للتواصل مع العملاء
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Phone className="h-4 w-4 ml-2" />
                          رقم الهاتف *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="+966 50 123 4567"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormDescription>
                          رقم الهاتف الرئيسي للتواصل
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <MapPin className="h-4 w-4 ml-2" />
                        العنوان *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="الرياض، المملكة العربية السعودية"
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        عنوان الشركة الذي سيظهر للعملاء
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          رقم الواتساب (اختياري)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="+966 50 123 4567"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormDescription>
                          رقم الواتساب للتواصل السريع
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          ساعات العمل (اختياري)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="الأحد - الخميس: 9:00 ص - 6:00 م"
                          />
                        </FormControl>
                        <FormDescription>
                          أوقات العمل الرسمية
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    disabled={isLoading || saveSettingsMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {(isLoading || saveSettingsMutation.isPending) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 ml-2" />
                        حفظ الإعدادات
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SiteSettingsPage;