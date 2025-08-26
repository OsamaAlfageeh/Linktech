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
import { validatePhoneNumber, validateEmail, validateName, validateContactForm } from '@/lib/validation';

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
  
  // Validation states
  const [nameValidation, setNameValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });

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

  // Enhanced input handlers with real-time validation
  const handleNameChange = (value: string) => {
    setEntrepreneurName(value);
    const validation = validateName(value);
    setNameValidation(validation);
  };

  const handleEmailChange = (value: string) => {
    setEntrepreneurEmail(value);
    const validation = validateEmail(value);
    setEmailValidation(validation);
  };

  const handlePhoneChange = (value: string) => {
    setEntrepreneurPhone(value);
    const validation = validatePhoneNumber(value);
    setPhoneValidation(validation);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      toast({
        title: "يرجى الموافقة على الشروط",
        description: "يجب عليك الموافقة على شروط اتفاقية عدم الإفصاح للمتابعة.",
        variant: "destructive",
      });
      return;
    }

    // Comprehensive validation using expert validation system
    const validation = validateContactForm({
      name: entrepreneurName,
      email: entrepreneurEmail,
      phone: entrepreneurPhone
    });
    
    if (!validation.isValid) {
      // Update validation states for UI feedback
      setNameValidation(validation.errors.name ? { isValid: false, message: validation.errors.name } : { isValid: true });
      setEmailValidation(validation.errors.email ? { isValid: false, message: validation.errors.email } : { isValid: true });
      setPhoneValidation(validation.errors.phone ? { isValid: false, message: validation.errors.phone } : { isValid: true });
      
      // Show first error as toast
      const firstError = Object.values(validation.errors)[0];
      toast({
        title: "بيانات غير صحيحة",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    // All validations passed, use formatted data
    const formattedData = validation.formattedData!;
    completeNdaMutation.mutate({
      entrepreneur: {
        name: formattedData.name,
        email: formattedData.email,
        phone: formattedData.phone,
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
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="أحمد محمد السعودي"
                      required
                      className={`mt-1 ${
                        entrepreneurName && !nameValidation.isValid 
                          ? 'border-red-500 focus:border-red-500' 
                          : nameValidation.message && nameValidation.isValid
                          ? 'border-green-500 focus:border-green-500'
                          : ''
                      }`}
                    />
                    {entrepreneurName && nameValidation.message && (
                      <p className={`text-sm mt-1 ${
                        nameValidation.isValid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {nameValidation.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="entrepreneurEmail">البريد الإلكتروني *</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="entrepreneurEmail"
                        type="email"
                        value={entrepreneurEmail}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="ahmed@example.com"
                        required
                        className={`mt-1 pr-10 ${
                          entrepreneurEmail && !emailValidation.isValid 
                            ? 'border-red-500 focus:border-red-500' 
                            : emailValidation.message && emailValidation.isValid
                            ? 'border-green-500 focus:border-green-500'
                            : ''
                        }`}
                      />
                    </div>
                    {entrepreneurEmail && emailValidation.message && (
                      <p className={`text-sm mt-1 ${
                        emailValidation.isValid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {emailValidation.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="entrepreneurPhone">رقم الهاتف *</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="entrepreneurPhone"
                        type="tel"
                        value={entrepreneurPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="+966xxxxxxxx أو 05xxxxxxxx"
                        required
                        className={`mt-1 pr-10 ${
                          entrepreneurPhone && !phoneValidation.isValid 
                            ? 'border-red-500 focus:border-red-500' 
                            : phoneValidation.message && phoneValidation.isValid
                            ? 'border-green-500 focus:border-green-500'
                            : ''
                        }`}
                      />
                    </div>
                    {entrepreneurPhone && phoneValidation.message && (
                      <p className={`text-sm mt-1 ${
                        phoneValidation.isValid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {phoneValidation.message}
                      </p>
                    )}
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