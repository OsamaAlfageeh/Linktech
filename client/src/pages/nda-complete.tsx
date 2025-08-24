import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, User, Phone, Mail, CheckCircle } from "lucide-react";
import SEO from "@/components/seo/SEO";

export default function NdaCompletePage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const ndaId = params.ndaId ? parseInt(params.ndaId) : null;
  
  // معلومات صاحب المشروع
  const [entrepreneurName, setEntrepreneurName] = useState("");
  const [entrepreneurEmail, setEntrepreneurEmail] = useState("");
  const [entrepreneurPhone, setEntrepreneurPhone] = useState("");
  const [agreed, setAgreed] = useState(false);

  const completeNdaMutation = useMutation({
    mutationFn: async (data: {
      entrepreneur: { name: string; email: string; phone: string };
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/nda/${ndaId}/complete`,
        data
      );
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['/api/notifications'],
      });
      toast({
        title: "تم إكمال بيانات اتفاقية عدم الإفصاح",
        description: "تم إكمال بياناتك بنجاح. سيتم إرسال دعوات التوقيع الإلكتروني عبر صادق قريباً.",
      });
      navigate("/notifications");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إكمال البيانات",
        description: error.message || "حدث خطأ أثناء إكمال بيانات اتفاقية عدم الإفصاح",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entrepreneurName || !entrepreneurEmail || !entrepreneurPhone) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال جميع البيانات المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    if (!agreed) {
      toast({
        title: "يرجى الموافقة على الشروط",
        description: "يجب عليك الموافقة على شروط اتفاقية عدم الإفصاح للمتابعة.",
        variant: "destructive",
      });
      return;
    }

    completeNdaMutation.mutate({
      entrepreneur: {
        name: entrepreneurName,
        email: entrepreneurEmail,
        phone: entrepreneurPhone,
      },
    });
  };

  if (!ndaId) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">رابط غير صالح</h2>
          <p className="text-gray-600">الرابط المستخدم غير صالح أو منتهي الصلاحية.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="إكمال بيانات اتفاقية عدم الإفصاح"
        description="أكمل بياناتك لإنهاء عملية إنشاء اتفاقية عدم الإفصاح والبدء في التوقيع الإلكتروني"
      />
      
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              إكمال بيانات اتفاقية عدم الإفصاح
            </h1>
            <p className="text-gray-600">
              يرجى إدخال بياناتك لإكمال عملية إنشاء اتفاقية عدم الإفصاح
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                بياناتك الشخصية
              </CardTitle>
              <CardDescription>
                ستستخدم هذه البيانات في عملية التوقيع الإلكتروني عبر صادق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="entrepreneurName">الاسم الكامل *</Label>
                    <Input
                      id="entrepreneurName"
                      type="text"
                      value={entrepreneurName}
                      onChange={(e) => setEntrepreneurName(e.target.value)}
                      placeholder="أحمد محمد السعودي"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="entrepreneurEmail">البريد الإلكتروني *</Label>
                    <Input
                      id="entrepreneurEmail"
                      type="email"
                      value={entrepreneurEmail}
                      onChange={(e) => setEntrepreneurEmail(e.target.value)}
                      placeholder="ahmed@example.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="entrepreneurPhone">رقم الهاتف *</Label>
                    <Input
                      id="entrepreneurPhone"
                      type="tel"
                      value={entrepreneurPhone}
                      onChange={(e) => setEntrepreneurPhone(e.target.value)}
                      placeholder="+966512345678"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    الخطوة التالية
                  </h4>
                  <p className="text-sm text-blue-700">
                    بعد إكمال بياناتك، ستتلقى رابط التوقيع الإلكتروني عبر البريد الإلكتروني. 
                    ستحتاج للتحقق من هويتك عبر نفاذ لإكمال عملية التوقيع.
                  </p>
                </div>

                <div className="flex items-start space-x-2 space-x-reverse">
                  <Checkbox
                    id="agree"
                    checked={agreed}
                    onCheckedChange={setAgreed}
                    className="mt-1"
                  />
                  <Label htmlFor="agree" className="text-sm leading-relaxed">
                    أوافق على شروط اتفاقية عدم الإفصاح وأؤكد صحة البيانات المدخلة.
                    أتفهم أن هذه البيانات ستستخدم في عملية التوقيع الإلكتروني عبر منصة صادق.
                  </Label>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={completeNdaMutation.isPending}
                    className="flex-1"
                  >
                    {completeNdaMutation.isPending ? "جاري الإرسال..." : "إكمال البيانات"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/notifications")}
                    className="px-8"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}