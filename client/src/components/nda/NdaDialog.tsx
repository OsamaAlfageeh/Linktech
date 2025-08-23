import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Shield, FileCheck, FileText, Lock } from "lucide-react";

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
  
  // معلومات صاحب المشروع
  const [entrepreneurName, setEntrepreneurName] = useState("");
  const [entrepreneurEmail, setEntrepreneurEmail] = useState("");
  const [entrepreneurPhone, setEntrepreneurPhone] = useState("");
  
  // معلومات ممثل الشركة
  const [companyRepName, setCompanyRepName] = useState("");
  const [companyRepEmail, setCompanyRepEmail] = useState("");
  const [companyRepPhone, setCompanyRepPhone] = useState("");
  
  const [agreed, setAgreed] = useState(false);

  const createNdaMutation = useMutation({
    mutationFn: async (data: {
      entrepreneur: { name: string; email: string; phone: string };
      companyRep: { name: string; email: string; phone: string };
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/projects/${projectId}/nda`,
        data
      );
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}`],
      });
      toast({
        title: "تم إنشاء اتفاقية عدم الإفصاح وإرسال دعوات التوقيع",
        description: `تم إرسال دعوات التوقيع الإلكتروني إلى كلا الطرفين:
        - ${entrepreneurEmail}
        - ${companyRepEmail}
        يرجى التحقق من البريد الإلكتروني لإكمال عملية التوقيع.`,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من البيانات المطلوبة
    if (!entrepreneurName || !entrepreneurEmail || !entrepreneurPhone) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال جميع بيانات صاحب المشروع",
        variant: "destructive",
      });
      return;
    }
    
    if (!companyRepName || !companyRepEmail || !companyRepPhone) {
      toast({
        title: "بيانات ناقصة", 
        description: "يرجى إدخال جميع بيانات ممثل الشركة",
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

    createNdaMutation.mutate({
      entrepreneur: {
        name: entrepreneurName,
        email: entrepreneurEmail,
        phone: entrepreneurPhone,
      },
      companyRep: {
        name: companyRepName,
        email: companyRepEmail,
        phone: companyRepPhone,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center mb-2">
            <Shield className="h-6 w-6 text-primary ml-2" />
            <DialogTitle>اتفاقية عدم الإفصاح</DialogTitle>
          </div>
          <DialogDescription>
            للاطلاع على تفاصيل المشروع والمشاركة فيه، يجب عليك توقيع اتفاقية عدم الإفصاح إلكترونياً عبر نفاذ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* معلومات صاحب المشروع */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold mb-3 text-green-800">
                معلومات صاحب المشروع (الطرف الأول)
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="entrepreneurName">الاسم الكامل</Label>
                  <Input
                    id="entrepreneurName"
                    type="text"
                    value={entrepreneurName}
                    onChange={(e) => setEntrepreneurName(e.target.value)}
                    placeholder="أحمد محمد السعودي"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="entrepreneurEmail">البريد الإلكتروني</Label>
                  <Input
                    id="entrepreneurEmail"
                    type="email"
                    value={entrepreneurEmail}
                    onChange={(e) => setEntrepreneurEmail(e.target.value)}
                    placeholder="owner@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="entrepreneurPhone">رقم الهاتف</Label>
                  <Input
                    id="entrepreneurPhone"
                    type="tel"
                    value={entrepreneurPhone}
                    onChange={(e) => setEntrepreneurPhone(e.target.value)}
                    placeholder="+966512345678"
                    required
                  />
                </div>
              </div>
            </div>

            {/* معلومات ممثل الشركة */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-3 text-blue-800">
                معلومات ممثل الشركة (الطرف الثاني)
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="companyRepName">الاسم الكامل</Label>
                  <Input
                    id="companyRepName"
                    type="text"
                    value={companyRepName}
                    onChange={(e) => setCompanyRepName(e.target.value)}
                    placeholder="محمد علي التقني"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="companyRepEmail">البريد الإلكتروني</Label>
                  <Input
                    id="companyRepEmail"
                    type="email"
                    value={companyRepEmail}
                    onChange={(e) => setCompanyRepEmail(e.target.value)}
                    placeholder="rep@company.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="companyRepPhone">رقم الهاتف</Label>
                  <Input
                    id="companyRepPhone"
                    type="tel"
                    value={companyRepPhone}
                    onChange={(e) => setCompanyRepPhone(e.target.value)}
                    placeholder="+966523456789"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>ملاحظة:</strong> سيتم إرسال دعوات التوقيع الإلكتروني إلى كلا الطرفين. يجب على كل طرف التحقق من هويته عبر نفاذ لإكمال التوقيع.
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
        </div>
      </DialogContent>
    </Dialog>
  );
}