import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";

// Content filter function to prevent contact information in offers
const checkForProhibitedContent = (text: string): { isValid: boolean; message: string } => {
  const normalizedText = text.toLowerCase().replace(/\s+/g, '');
  
  // Phone number patterns (Arabic and English digits)
  const phonePatterns = [
    /[٠١٢٣٤٥٦٧٨٩]{2,}/g,  // Arabic digits (2 or more)
    /\d{2,}/g,              // English digits (2 or more)
  ];
  
  // Email pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  // Website/URL patterns
  const urlPatterns = [
    /https?:\/\/[^\s]+/g,
    /www\.[^\s]+/g,
    /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/g, // domain patterns
  ];
  
  // Social media patterns
  const socialPatterns = [
    /@[a-zA-Z0-9_]+/g,      // @username
    /instagram\.com/i,
    /facebook\.com/i,
    /twitter\.com/i,
    /linkedin\.com/i,
    /whatsapp/i,
    /telegram/i,
    /snapchat/i,
  ];
  
  // Contact keywords (Arabic and English)
  const contactKeywords = [
    /واتساب|whatsapp/i,
    /تيليجرام|telegram/i,
    /انستقرام|instagram/i,
    /فيسبوك|facebook/i,
    /تويتر|twitter/i,
    /لينكد إن|linkedin/i,
    /سناب شات|snapchat/i,
    /اتصل|call/i,
    /تواصل|contact/i,
    /رقم|number/i,
    /هاتف|phone/i,
    /جوال|mobile/i,
    /ايميل|email/i,
    /بريد|mail/i,
  ];
  
  // Check for phone numbers
  for (const pattern of phonePatterns) {
    if (pattern.test(text)) {
      return {
        isValid: false,
        message: "لا يُسمح بإدراج أرقام الهواتف في عرض الشركة"
      };
    }
  }
  
  // Check for email addresses
  if (emailPattern.test(text)) {
    return {
      isValid: false,
      message: "لا يُسمح بإدراج عناوين البريد الإلكتروني في عرض الشركة"
    };
  }
  
  // Check for URLs/websites
  for (const pattern of urlPatterns) {
    if (pattern.test(text)) {
      return {
        isValid: false,
        message: "لا يُسمح بإدراج روابط المواقع في عرض الشركة"
      };
    }
  }
  
  // Check for social media
  for (const pattern of socialPatterns) {
    if (pattern.test(text)) {
      return {
        isValid: false,
        message: "لا يُسمح بإدراج حسابات وسائل التواصل الاجتماعي في عرض الشركة"
      };
    }
  }
  
  // Check for contact keywords
  for (const pattern of contactKeywords) {
    if (pattern.test(text)) {
      return {
        isValid: false,
        message: "لا يُسمح بإدراج معلومات التواصل المباشر في عرض الشركة"
      };
    }
  }
  
  return { isValid: true, message: "" };
};

// تعريف نموذج التحقق من صحة البيانات
const offerSchema = z.object({
  amount: z.string()
    .min(1, "مبلغ العرض مطلوب")
    .refine((val) => /^[0-9,]+$/.test(val), {
      message: "يجب أن يحتوي مبلغ العرض على أرقام فقط (يسمح بالفواصل)"
    })
    .transform((val) => val.replace(/,/g, "")), // إزالة الفواصل للتخزين
  duration: z.string()
    .min(1, "مدة التنفيذ مطلوبة")
    .max(100, "مدة التنفيذ طويلة جداً")
    .refine((val) => checkForProhibitedContent(val).isValid, {
      message: "مدة التنفيذ تحتوي على محتوى غير مسموح"
    }),
  description: z.string()
    .min(20, "وصف العرض يجب أن يحتوي على 20 حرف على الأقل")
    .max(5000, "الوصف طويل جداً، الحد الأقصى 5000 حرف")
    .refine((val) => checkForProhibitedContent(val).isValid, {
      message: "وصف العرض يحتوي على محتوى غير مسموح"
    }),
});

type OfferFormValues = z.infer<typeof offerSchema>;

interface CreateOfferFormProps {
  projectId: number;
  onSuccess?: () => void;
}

export function CreateOfferForm({ projectId, onSuccess }: CreateOfferFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      amount: "",
      duration: "",
      description: "",
    },
  });

  const onSubmit = async (data: OfferFormValues) => {
    try {
      setIsSubmitting(true);
      
      // إرسال العرض إلى الخادم
      const res = await apiRequest("POST", `/api/projects/${projectId}/offers`, data);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "حدث خطأ أثناء إرسال العرض");
      }
      
      toast({
        title: "تم إرسال العرض بنجاح",
        description: "سيتم إشعار صاحب المشروع بعرضك",
      });
      
      // تحديث البيانات المخزنة
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/offers`] });
      
      // إعادة ضبط النموذج
      form.reset();
      
      // تنفيذ دالة النجاح إذا كانت موجودة
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "فشل إرسال العرض",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">تقديم عرض سعر</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content Filter Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 ml-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">ملاحظة مهمة:</p>
              <p>لا يُسمح بإدراج معلومات التواصل المباشر مثل:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>أرقام الهواتف أو الجوال</li>
                <li>عناوين البريد الإلكتروني</li>
                <li>روابط المواقع أو وسائل التواصل الاجتماعي</li>
                <li>أي معلومات تؤدي للتواصل خارج المنصة</li>
              </ul>
            </div>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>قيمة العرض (بالريال السعودي)</FormLabel>
                  <FormControl>
                    <Input {...field} dir="rtl" placeholder="15,000" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مدة التنفيذ</FormLabel>
                  <FormControl>
                    <Input {...field} dir="rtl" placeholder="شهرين" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تفاصيل العرض</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="اشرح تفاصيل عرضك وكيفية تنفيذ المشروع واي ميزات إضافية تقدمها..." 
                      rows={6}
                      dir="rtl"
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
                "إرسال العرض"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}