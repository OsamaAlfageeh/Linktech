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
import { Loader2 } from "lucide-react";

// تعريف نموذج التحقق من صحة البيانات
const offerSchema = z.object({
  amount: z.string().min(1, "مبلغ العرض مطلوب"),
  duration: z.string().min(1, "مدة التنفيذ مطلوبة"),
  description: z.string().min(20, "وصف العرض يجب أن يحتوي على 20 حرف على الأقل"),
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