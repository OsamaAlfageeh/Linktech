import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, User, Phone, Mail, CheckCircle, Clock, UserCheck, AlertCircle } from "lucide-react";
import SEO from "@/components/seo/SEO";
import { validatePhoneNumber, validateEmail, validateName, validateContactForm } from '@/lib/validation';

interface NdaStatus {
  id: number;
  status: string;
  envelopeStatus?: string;
  createdAt?: string;
  signedAt?: string;
  projectId?: number;
  sadiqReferenceNumber?: string;
  sadiqStatus?: {
    completionPercentage: number;
    signedCount: number;
    pendingCount: number;
    totalSignatories: number;
    createDate?: string;
    signatories?: Array<{
      id: string;
      status: string;
      fullName: string;
      fullNameAr: string;
      email: string;
      phoneNumber: string;
    }>;
    documents?: Array<{
      id: string;
      fileName: string;
      uploadDate: string;
      sizeInKB: number;
      isSigned: boolean;
    }>;
  };
}

export default function NdaCompletePage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const ndaId = params.ndaId ? parseInt(params.ndaId) : null;
  
  // Get NDA status first
  const { data: ndaStatus, isLoading: statusLoading, error: statusError } = useQuery<NdaStatus>({
    queryKey: [`/api/nda/${ndaId}/status`],
    enabled: !!ndaId,
    retry: false,
  });
  
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
        description: data.message || "تم إكمال بياناتك بنجاح. سيتم إرسال دعوات التوقيع الإلكتروني عبر صادق قريباً.",
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

  // Show loading while checking status
  if (statusLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">جاري التحقق من الحالة...</h2>
          <p className="text-gray-600">نتحقق من حالة اتفاقية عدم الإفصاح الحالية.</p>
        </div>
      </div>
    );
  }

  // Show error if status check failed
  if (statusError || !ndaStatus) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">خطأ في الوصول</h2>
          <p className="text-gray-600">لا يمكن الوصول لبيانات اتفاقية عدم الإفصاح. يرجى المحاولة لاحقاً.</p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/notifications")} 
            className="mt-4"
          >
            العودة للإشعارات
          </Button>
        </div>
      </div>
    );
  }

  // Show status page if NDA is not awaiting entrepreneur completion
  if (ndaStatus.status !== 'awaiting_entrepreneur') {
    return (
      <>
        <SEO 
          title="حالة اتفاقية عدم الإفصاح"
          description="تتبع حالة اتفاقية عدم الإفصاح وعملية التوقيع الإلكتروني"
        />
        
        <div className="container mx-auto py-8 px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  {ndaStatus.status === 'signed' ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : ndaStatus.status === 'invitation_sent' ? (
                    <UserCheck className="h-8 w-8 text-blue-600" />
                  ) : (
                    <Clock className="h-8 w-8 text-yellow-600" />
                  )}
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                حالة اتفاقية عدم الإفصاح
              </h1>
              <p className="text-gray-600">
                تتبع حالة اتفاقية عدم الإفصاح وعملية التوقيع
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  معلومات الاتفاقية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Status */}
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">الحالة الحالية:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    ndaStatus.status === 'signed' ? 'bg-green-100 text-green-800' :
                    ndaStatus.status === 'invitation_sent' ? 'bg-blue-100 text-blue-800' :
                    ndaStatus.status === 'ready_for_sadiq' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ndaStatus.status === 'signed' ? 'مكتملة ومُوقعة' :
                     ndaStatus.status === 'invitation_sent' ? 'تم إرسال دعوات التوقيع' :
                     ndaStatus.status === 'ready_for_sadiq' ? 'جاهزة للإرسال' :
                     'قيد المعالجة'}
                  </span>
                </div>

                {/* Creation Date */}
                {ndaStatus.createdAt && (
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-gray-600">تاريخ الإنشاء:</span>
                    <span className="font-medium">
                      {new Date(ndaStatus.createdAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {/* Signed Date */}
                {ndaStatus.signedAt && (
                  <div className="flex justify-between items-center p-3 border rounded-lg bg-green-50">
                    <span className="text-green-700">تاريخ التوقيع:</span>
                    <span className="font-medium text-green-800">
                      {new Date(ndaStatus.signedAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {/* Reference Number */}
                {ndaStatus.sadiqReferenceNumber && (
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-gray-600">رقم المرجع:</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {ndaStatus.sadiqReferenceNumber}
                    </span>
                  </div>
                )}

                {/* Sadiq Status Details */}
                {ndaStatus.sadiqStatus && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 border-b pb-2">تفاصيل التوقيع الإلكتروني</h4>
                    
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>نسبة الإكمال:</span>
                        <span className="font-semibold">{ndaStatus.sadiqStatus.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${ndaStatus.sadiqStatus.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-700">{ndaStatus.sadiqStatus.signedCount}</div>
                        <div className="text-sm text-green-600">تم التوقيع</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-700">{ndaStatus.sadiqStatus.pendingCount}</div>
                        <div className="text-sm text-orange-600">في الانتظار</div>
                      </div>
                    </div>

                    {/* Signatories */}
                    {ndaStatus.sadiqStatus.signatories && ndaStatus.sadiqStatus.signatories.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-gray-700">الموقعين:</h5>
                        {ndaStatus.sadiqStatus.signatories.map((signatory, index) => (
                          <div key={signatory.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium text-sm">
                                {signatory.fullNameAr || signatory.fullName}
                              </div>
                              <div className="text-xs text-gray-500">{signatory.email}</div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              signatory.status === 'SIGNED' ? 'bg-green-100 text-green-700' :
                              signatory.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {signatory.status === 'SIGNED' ? 'تم التوقيع' :
                               signatory.status === 'PENDING' ? 'في الانتظار' :
                               signatory.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Documents */}
                    {ndaStatus.sadiqStatus.documents && ndaStatus.sadiqStatus.documents.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-gray-700">المستندات:</h5>
                        {ndaStatus.sadiqStatus.documents.map((doc, index) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium text-sm">{doc.fileName}</div>
                              <div className="text-xs text-gray-500">
                                حجم الملف: {doc.sizeInKB} كيلوبايت
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              doc.isSigned ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {doc.isSigned ? 'موقع' : 'غير موقع'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sadiq Creation Date */}
                    {ndaStatus.sadiqStatus.createDate && (
                      <div className="flex justify-between items-center p-3 border rounded-lg bg-blue-50">
                        <span className="text-blue-700">تاريخ الإنشاء في صادق:</span>
                        <span className="font-medium text-blue-800">
                          {new Date(ndaStatus.sadiqStatus.createDate).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}

                    {ndaStatus.sadiqStatus.pendingCount > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          في انتظار {ndaStatus.sadiqStatus.pendingCount} توقيع إضافي لإكمال الاتفاقية
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {ndaStatus.status === 'signed' && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">تم إكمال التوقيع بنجاح!</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      تم توقيع اتفاقية عدم الإفصاح من جميع الأطراف. يمكنك الآن المتابعة مع المشروع.
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/notifications")}
                    className="flex-1"
                  >
                    العودة للإشعارات
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="ghost"
                  >
                    تحديث الحالة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
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
                    onCheckedChange={(checked) => setAgreed(checked === true)}
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