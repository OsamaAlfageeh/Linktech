import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Info, ExternalLink } from "lucide-react";
import { NdaDialog } from "./NdaDialog";

interface NdaSectionProps {
  projectId: number;
  projectTitle: string;
  requiresNda?: boolean;
  ndaId?: number;
  userId: number;
  currentUserId?: number;
  userRole?: string;
}

export function NdaSection({
  projectId,
  projectTitle,
  requiresNda,
  ndaId,
  userId,
  currentUserId,
  userRole,
}: NdaSectionProps) {
  const [isNdaDialogOpen, setIsNdaDialogOpen] = useState(false);
  
  // إذا كان هناك معرف اتفاقية، نقوم بجلب تفاصيلها
  const {
    data: ndaData,
    isLoading: isLoadingNda,
  } = useQuery({
    queryKey: [`/api/nda/${ndaId}`],
    enabled: !!ndaId && ndaId > 0,
  });

  // إذا كان المستخدم هو صاحب المشروع، نقوم بجلب جميع اتفاقيات المشروع
  const {
    data: projectNdas,
    isLoading: isLoadingProjectNdas,
  } = useQuery({
    queryKey: [`/api/projects/${projectId}/nda`],
    enabled: !!projectId && userRole === 'admin' || (currentUserId === userId), // فقط المسؤولون أو صاحب المشروع
  });

  // التحقق مما إذا كان المستخدم شركة ويمكنه توقيع اتفاقية عدم الإفصاح
  const canSignNda = userRole === 'company' && currentUserId !== userId;

  // التحقق مما إذا كان المستخدم الحالي هو صاحب المشروع
  const isProjectOwner = currentUserId === userId;

  // التحقق مما إذا كان المستخدم مسؤول
  const isAdmin = userRole === 'admin';

  // التحقق مما إذا كان المستخدم الحالي قد وقع بالفعل على اتفاقية عدم الإفصاح لهذا المشروع
  const hasSignedNda = !!ndaData;

  // عندما لا يتطلب المشروع اتفاقية عدم إفصاح أو المستخدم ليس شركة، لا نعرض شيئاً
  if (!requiresNda && !isProjectOwner && !isAdmin) {
    return null;
  }

  // إذا كان المستخدم صاحب المشروع، نعرض قائمة بالشركات التي وقعت اتفاقية عدم الإفصاح
  if (isProjectOwner || isAdmin) {
    return (
      <div className="mb-8 bg-white p-5 rounded-lg border border-neutral-200">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 text-primary ml-2" />
          <h2 className="text-xl font-semibold">اتفاقيات عدم الإفصاح</h2>
        </div>
        
        {isLoadingProjectNdas ? (
          <div className="text-neutral-600 text-sm">جاري تحميل اتفاقيات عدم الإفصاح...</div>
        ) : projectNdas && projectNdas.length > 0 ? (
          <div>
            <p className="text-neutral-700 mb-2">
              تم توقيع {projectNdas.length} اتفاقية عدم إفصاح على هذا المشروع من قبل الشركات التالية:
            </p>
            <div className="mt-3 space-y-2">
              {projectNdas.map((nda: any) => (
                <div 
                  key={nda.id} 
                  className="border border-neutral-200 rounded p-3 bg-neutral-50 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">
                      {isAdmin 
                        ? nda.companySignatureInfo.companyName 
                        : `شركة ${nda.companySignatureInfo.companyName?.charAt(0) || ""}...`}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      تم التوقيع بواسطة: {nda.companySignatureInfo.signerName} ({nda.companySignatureInfo.signerTitle})
                    </div>
                    <div className="text-xs text-neutral-500">
                      تاريخ التوقيع: {new Date(nda.signedAt).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                  <Badge variant={nda.status === 'active' ? 'success' : 'outline'}>
                    {nda.status === 'active' ? 'سارية' : 'معلقة'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-neutral-700">
            لم يتم توقيع أي اتفاقية عدم إفصاح على هذا المشروع بعد.
          </p>
        )}
      </div>
    );
  }

  // إذا كان المستخدم شركة ويمكنه توقيع اتفاقية عدم الإفصاح
  if (canSignNda) {
    return (
      <div className="mb-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <div className="flex items-start">
            <Lock className="h-6 w-6 text-amber-600 mt-1 ml-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 text-lg mb-2">هذا المشروع يتطلب اتفاقية عدم إفصاح</h3>
              
              {hasSignedNda ? (
                <div>
                  <p className="text-amber-700 mb-3">
                    لقد قمت بالفعل بتوقيع اتفاقية عدم الإفصاح لهذا المشروع. يمكنك الآن الاطلاع على تفاصيل المشروع وتقديم عرضك.
                  </p>
                  
                  <div className="bg-white rounded p-3 border border-amber-200 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-neutral-800">حالة الاتفاقية:</span>
                      <Badge variant={ndaData?.status === 'active' ? 'success' : 'outline'}>
                        {ndaData?.status === 'active' ? 'سارية' : 'معلقة'}
                      </Badge>
                    </div>
                    {ndaData?.pdfUrl && (
                      <a 
                        href={ndaData.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-dark flex items-center mt-2"
                      >
                        <ExternalLink className="h-4 w-4 ml-1" />
                        عرض نسخة PDF من الاتفاقية
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-amber-700 mb-3">
                    يجب عليك توقيع اتفاقية عدم إفصاح قبل أن تتمكن من الاطلاع على كافة تفاصيل المشروع وتقديم عرضك.
                  </p>
                  
                  <div className="flex items-start text-sm bg-white p-3 rounded border border-amber-200 mb-4">
                    <Info className="h-5 w-5 text-amber-600 ml-2 flex-shrink-0" />
                    <p className="text-neutral-700">
                      بتوقيع هذه الاتفاقية، أنت توافق على المحافظة على سرية جميع المعلومات المتعلقة بهذا المشروع وعدم مشاركتها مع أي طرف ثالث.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => setIsNdaDialogOpen(true)}
                    className="bg-gradient-to-l from-blue-600 to-primary hover:from-blue-700 hover:to-primary-dark"
                  >
                    <Shield className="ml-2 h-5 w-5" />
                    توقيع اتفاقية عدم الإفصاح
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* مربع حوار توقيع اتفاقية عدم الإفصاح */}
        <NdaDialog 
          projectId={projectId}
          projectTitle={projectTitle}
          isOpen={isNdaDialogOpen}
          onOpenChange={setIsNdaDialogOpen}
        />
      </div>
    );
  }

  return null;
}