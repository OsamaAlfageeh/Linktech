import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Shield, FileCheck, FileText, Lock, User, Phone, Mail } from "lucide-react";

interface NdaDialogProps {
  projectId: number;
  projectTitle: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (ndaId: number) => void;
}

export function NdaDialog({
  projectId,
  projectTitle,
  isOpen,
  onOpenChange,
  onSuccess,
}: NdaDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<'validation' | 'agreement'>('validation');
  
  // Contact information state
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: ''
  });
  
  // Validation state
  const [needsEmail, setNeedsEmail] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);
  
  // Get current user info
  const { data: auth } = useQuery<any>({
    queryKey: ['/api/auth/user'],
  });

  // Validation mutation to check what contact info is missing
  const validateContactMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/projects/${projectId}/nda/validate-contact`,
        {}
      );
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        // All contact info is complete, proceed to agreement step
        setStep('agreement');
      } else {
        // Show input fields for missing information
        setNeedsEmail(!data.hasEmail);
        setNeedsPhone(!data.hasPhone);
        
        // Pre-fill existing information
        if (data.hasEmail && auth?.user?.email) {
          setContactInfo(prev => ({ ...prev, email: auth.user.email }));
        }
        if (data.existingPhone) {
          setContactInfo(prev => ({ ...prev, phone: data.existingPhone }));
        }
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ في التحقق من البيانات",
        description: error.message || "حدث خطأ أثناء التحقق من بياناتك.",
        variant: "destructive",
      });
    },
  });

  // Update contact information mutation
  const updateContactMutation = useMutation({
    mutationFn: async (contactData: { email?: string; phone?: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/projects/${projectId}/nda/update-contact`,
        contactData
      );
      return await response.json();
    },
    onSuccess: () => {
      setStep('agreement');
      toast({
        title: "تم تحديث معلومات الاتصال",
        description: "تم حفظ معلومات الاتصال الخاصة بك بنجاح.",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في تحديث البيانات",
        description: error.message || "حدث خطأ أثناء تحديث معلومات الاتصال.",
        variant: "destructive",
      });
    },
  });

  // Create NDA mutation
  const createNdaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/projects/${projectId}/nda/initiate`,
        {}
      );
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}`],
      });
      toast({
        title: "تم إنشاء طلب اتفاقية عدم الإفصاح",
        description: `تم إرسال إشعار إلى صاحب المشروع لإكمال بياناته. ستتلقى تأكيداً عبر البريد الإلكتروني عند اكتمال العملية.`,
      });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ في إرسال دعوة التوقيع",
        description: error.message || "حدث خطأ أثناء إرسال دعوة التوقيع. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep('validation');
      setAgreed(false);
      setContactInfo({ email: '', phone: '' });
      setNeedsEmail(false);
      setNeedsPhone(false);
      
      // Validate contact information when dialog opens
      validateContactMutation.mutate();
    }
  }, [isOpen]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required contact information
    if (needsEmail && !contactInfo.email.trim()) {
      toast({
        title: "البريد الإلكتروني مطلوب",
        description: "يرجى إدخال عنوان بريد إلكتروني صحيح.",
        variant: "destructive",
      });
      return;
    }
    
    if (needsPhone && !contactInfo.phone.trim()) {
      toast({
        title: "رقم الهاتف مطلوب",
        description: "يرجى إدخال رقم هاتف صحيح.",
        variant: "destructive",
      });
      return;
    }

    // Update contact information
    const updateData: { email?: string; phone?: string } = {};
    if (needsEmail) updateData.email = contactInfo.email;
    if (needsPhone) updateData.phone = contactInfo.phone;
    
    updateContactMutation.mutate(updateData);
  };

  const handleAgreementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      toast({
        title: "يرجى الموافقة على الشروط",
        description: "يجب عليك الموافقة على شروط اتفاقية عدم الإفصاح للمتابعة.",
        variant: "destructive",
      });
      return;
    }

    createNdaMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center mb-2">
            <Shield className="h-6 w-6 text-primary ml-2" />
            <DialogTitle>
              {step === 'validation' ? 'تأكيد معلومات الاتصال' : 'اتفاقية عدم الإفصاح'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {step === 'validation' 
              ? 'يرجى تأكيد أو إكمال معلومات الاتصال الخاصة بك قبل المتابعة'
              : 'للاطلاع على تفاصيل المشروع والمشاركة فيه، يجب عليك توقيع اتفاقية عدم الإفصاح إلكترونياً عبر نفاذ'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {validateContactMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="mr-3">التحقق من البيانات...</span>
            </div>
          )}

          {/* Contact Information Step */}
          {step === 'validation' && !validateContactMutation.isPending && (needsEmail || needsPhone) && (
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
                <User className="h-5 w-5 text-blue-600 mt-0.5 ml-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800">إكمال معلومات الاتصال</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    نحتاج إلى معلومات اتصال كاملة لإتمام عملية التوقيع الإلكتروني عبر نفاذ.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {needsEmail && (
                  <div>
                    <Label htmlFor="email" className="flex items-center">
                      <Mail className="h-4 w-4 ml-1" />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="أدخل بريدك الإلكتروني"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1"
                      required
                    />
                  </div>
                )}

                {needsPhone && (
                  <div>
                    <Label htmlFor="phone" className="flex items-center">
                      <Phone className="h-4 w-4 ml-1" />
                      رقم الهاتف
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="أدخل رقم هاتفك (مثال: 0551234567)"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1"
                      required
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={updateContactMutation.isPending}>
                  {updateContactMutation.isPending ? "جاري الحفظ..." : "حفظ والمتابعة"}
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* Agreement Step */}
          {step === 'agreement' && (
            <>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5 ml-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800">توقيع إلكتروني معتمد</h4>
              <p className="text-sm text-blue-700 mt-1">
                مشروع "{projectTitle}" يتطلب توقيع اتفاقية عدم إفصاح معتمدة إلكترونياً. سيتم التحقق من هويتك عبر نفاذ وإرسال رابط التوقيع إلى بريدك الإلكتروني.
              </p>
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <h3 className="font-semibold mb-3 flex items-center">
              <FileText className="h-5 w-5 ml-2 text-neutral-700" />
              نص اتفاقية عدم الإفصاح
            </h3>
            <div className="text-sm text-neutral-700 space-y-3 max-h-48 overflow-y-auto p-3 bg-white rounded border border-neutral-200">
              <p className="font-bold text-center text-lg">اتفاقية عدم إفصاح</p>
              
              <p>
                <strong>المقدمة:</strong> هذه الاتفاقية ("الاتفاقية") محررة ومبرمة بتاريخ التوقيع الإلكتروني بينك ("الطرف المستلم") وبين صاحب المشروع ("الطرف المفصح").
              </p>
              
              <p>
                <strong>الغرض:</strong> لغرض تقييم إمكانية التعاون في تنفيذ المشروع المذكور، من الضروري أن يقوم الطرف المفصح بالكشف عن معلومات سرية وملكية فكرية للطرف المستلم.
              </p>
              
              <p>
                <strong>المعلومات السرية:</strong> تشمل "المعلومات السرية" جميع المعلومات والبيانات المتعلقة بالمشروع بما في ذلك على سبيل المثال لا الحصر: المواصفات التقنية، الوثائق، الرسومات، الخطط، الاستراتيجيات، الأفكار، المنهجيات، التصاميم، الشفرة المصدرية، واجهات المستخدم، أسرار تجارية، وأي معلومات أخرى تتعلق بالمشروع.
              </p>
              
              <p>
                <strong>التزامات الطرف المستلم:</strong> يوافق الطرف المستلم على:
              </p>
              <ol className="list-decimal pr-6 space-y-1">
                <li>الحفاظ على سرية جميع المعلومات السرية وعدم الكشف عنها لأي طرف ثالث.</li>
                <li>استخدام المعلومات السرية فقط لغرض تقييم إمكانية التعاون في تنفيذ المشروع.</li>
                <li>عدم نسخ أو تصوير أو تخزين أي من المعلومات السرية إلا بقدر ما هو ضروري لتحقيق الغرض من هذه الاتفاقية.</li>
                <li>اتخاذ جميع الإجراءات المعقولة للحفاظ على سرية المعلومات السرية بنفس مستوى العناية الذي يستخدمه لحماية معلوماته السرية الخاصة.</li>
                <li>إبلاغ الطرف المفصح فوراً في حالة علمه بأي استخدام أو كشف غير مصرح به للمعلومات السرية.</li>
              </ol>
              
              <p>
                <strong>مدة الاتفاقية:</strong> تبقى هذه الاتفاقية سارية المفعول لمدة سنتين (2) من تاريخ توقيعها.
              </p>
              
              <p>
                <strong>القانون الحاكم:</strong> تخضع هذه الاتفاقية وتفسر وفقاً لقوانين المملكة العربية السعودية.
              </p>
              
              <p>
                <strong>توقيع إلكتروني:</strong> يقر الطرفان بأن هذه الاتفاقية قد تم توقيعها إلكترونياً وأن هذا التوقيع الإلكتروني له نفس الأثر القانوني كالتوقيع اليدوي.
              </p>
            </div>
          </div>

              <form onSubmit={handleAgreementSubmit} className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-start">
                    <FileCheck className="h-5 w-5 text-green-600 mt-0.5 ml-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-2 text-green-800">
                        معلومات الاتصال محدثة
                      </h3>
                      <p className="text-sm text-green-700">
                        تم تأكيد جميع معلومات الاتصال المطلوبة للتوقيع الإلكتروني. سيتم استخدام هذه البيانات في اتفاقية عدم الإفصاح.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">الخطوة التالية</h4>
                  <p className="text-sm text-green-700">
                    بعد إرسال طلبك، سيتم إشعار صاحب المشروع لإكمال بياناته. عند اكتمال البيانات من الطرفين، ستتلقى رابط التوقيع الإلكتروني عبر البريد.
                  </p>
                </div>

                <div className="flex items-start space-x-2 space-x-reverse">
                  <Checkbox
                    id="agreed"
                    checked={agreed}
                    onCheckedChange={(checked) => setAgreed(checked as boolean)}
                    className="mt-1"
                  />
                  <div>
                    <Label
                      htmlFor="agreed"
                      className="text-sm font-normal cursor-pointer"
                    >
                      أقر وأوافق على جميع شروط وأحكام اتفاقية عدم الإفصاح وألتزم بها
                    </Label>
                    <p className="text-xs text-neutral-500 mt-1">
                      سيتم التحقق من هويتك رسمياً عبر نفاذ وحفظ جميع بيانات التوقيع الإلكتروني
                    </p>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="ml-2"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={createNdaMutation.isPending}
                    className="bg-gradient-to-l from-blue-600 to-primary hover:from-blue-700 hover:to-primary-dark"
                  >
                    {createNdaMutation.isPending ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    جاري الإرسال...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FileCheck className="ml-2 h-5 w-5" />
                    إرسال دعوة التوقيع الإلكتروني
                  </div>
                )}
              </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}