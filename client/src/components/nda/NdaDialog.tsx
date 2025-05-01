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
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("ممثل الشركة");
  const [agreed, setAgreed] = useState(false);

  const createNdaMutation = useMutation({
    mutationFn: async (data: { signerName: string; signerTitle: string }) => {
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
        title: "تم توقيع اتفاقية عدم الإفصاح بنجاح",
        description: "يمكنك الآن تقديم عرضك على هذا المشروع.",
      });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ في توقيع اتفاقية عدم الإفصاح",
        description: error.message || "حدث خطأ أثناء محاولة توقيع اتفاقية عدم الإفصاح. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

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

    if (!signerName.trim()) {
      toast({
        title: "يرجى إدخال اسم الموقّع",
        description: "يجب إدخال اسم الموقّع على اتفاقية عدم الإفصاح.",
        variant: "destructive",
      });
      return;
    }

    createNdaMutation.mutate({
      signerName,
      signerTitle,
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
            للاطلاع على تفاصيل المشروع والمشاركة فيه، يجب عليك توقيع اتفاقية عدم الإفصاح أولاً
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5 ml-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800">معلومات المشروع سرية</h4>
              <p className="text-sm text-blue-700 mt-1">
                مشروع "{projectTitle}" يتطلب الحفاظ على سرية المعلومات. بتوقيع هذه الاتفاقية، أنت توافق على عدم الإفصاح عن أي معلومات سرية تتعلق بهذا المشروع.
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signerName">اسم الموقّع الكامل</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="اكتب اسمك الكامل كما في الهوية"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signerTitle">المسمى الوظيفي</Label>
              <Input
                id="signerTitle"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                placeholder="المسمى الوظيفي في الشركة"
              />
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
                  سيتم تسجيل عنوان IP الخاص بك وتاريخ ووقت التوقيع كإثبات على موافقتك
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
                    جاري التوقيع...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FileCheck className="ml-2 h-5 w-5" />
                    توقيع الاتفاقية
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