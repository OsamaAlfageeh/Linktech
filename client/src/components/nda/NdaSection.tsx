import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Info, CheckCircle, Clock, AlertCircle, Users } from "lucide-react";
import { NdaDialog } from "./NdaDialog";

// تعريف نوع البيانات الخاص باتفاقية عدم الإفصاح
interface NdaAgreement {
  id: number;
  projectId: number;
  status: 'pending' | 'invitations_sent' | 'signed' | 'cancelled' | 'expired';
  envelopeStatus?: string;
  pdfUrl: string | null;
  createdAt: string;
  signedAt: string | null;
  expiresAt: string | null;
  sadiqReferenceNumber?: string;
  sadiqEnvelopeId?: string;
  companySignatureInfo?: {
    name: string;
    email: string;
    phone: string;
    companyName: string;
    companyUserId: number;
    createdAt: string;
  };
  entrepreneurInfo?: {
    name: string;
    email: string;
    phone: string;
    entrepreneurUserId: number;
    completedAt: string;
  };
}

interface NdaSectionProps {
  projectId: number;
  projectTitle: string;
  requiresNda?: boolean;
  ndaId?: number;
  userId: number;
  currentUserId?: number;
  userRole?: string;
}

// Helper functions for status display
const getStatusInfo = (status: string) => {
  switch (status) {
    case 'signed':
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'تم التوقيع',
        badgeVariant: 'secondary' as const,
        badgeClass: 'bg-green-100 text-green-800'
      };
    case 'invitations_sent':
      return {
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'في انتظار التوقيع',
        badgeVariant: 'outline' as const,
        badgeClass: 'border-blue-300 text-blue-700'
      };
    case 'pending':
      return {
        icon: AlertCircle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        label: 'معلق',
        badgeVariant: 'outline' as const,
        badgeClass: 'border-amber-300 text-amber-700'
      };
    case 'cancelled':
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'ملغي',
        badgeVariant: 'outline' as const,
        badgeClass: 'border-red-300 text-red-700'
      };
    default:
      return {
        icon: Clock,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        label: 'حالة غير معروفة',
        badgeVariant: 'outline' as const,
        badgeClass: 'border-gray-300 text-gray-700'
      };
  }
};

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
  } = useQuery<NdaAgreement>({
    queryKey: [`/api/nda/${ndaId}`],
    enabled: !!ndaId && ndaId > 0,
  });


  // إذا كان المستخدم هو صاحب المشروع، نقوم بجلب جميع اتفاقيات المشروع
  const {
    data: projectNdas,
    isLoading: isLoadingProjectNdas,
  } = useQuery<NdaAgreement[]>({
    queryKey: [`/api/projects/${projectId}/nda`],
    enabled: !!projectId && userRole === 'admin' || (currentUserId === userId), // فقط المسؤولون أو صاحب المشروع
  });

  // التحقق مما إذا كان المستخدم شركة ويمكنه توقيع اتفاقية عدم الإفصاح
  const canSignNda = userRole === 'company' && currentUserId !== userId;

  // التحقق مما إذا كان المستخدم الحالي هو صاحب المشروع
  const isProjectOwner = currentUserId === userId;

  // التحقق مما إذا كان المستخدم مسؤول
  const isAdmin = userRole === 'admin';

  // Check if current user (company) has signed NDA for this project
  const companyNda = projectNdas?.find(nda => 
    nda.companySignatureInfo?.companyUserId === currentUserId
  );
  
  // For companies: check if they already signed
  const hasCompanySignedNda = !!companyNda;
  
  // For specific NDA: check if it exists
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
            <p className="text-neutral-700 mb-4 flex items-center">
              <Users className="h-4 w-4 ml-2" />
              {projectNdas.length} شركة تفاعلت مع اتفاقية عدم الإفصاح لهذا المشروع:
            </p>
            <div className="mt-3 space-y-3">
              {projectNdas?.map((nda: NdaAgreement) => {
                const statusInfo = getStatusInfo(nda.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div 
                    key={nda.id} 
                    className={`border rounded-lg p-4 ${statusInfo.bgColor} ${statusInfo.borderColor}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <StatusIcon className={`h-5 w-5 ${statusInfo.color} ml-2`} />
                        <div className="font-medium text-lg">
                          {isAdmin 
                            ? nda.companySignatureInfo?.companyName || 'شركة غير محددة'
                            : `شركة ${nda.companySignatureInfo?.companyName?.charAt(0) || "G"}...`}
                        </div>
                      </div>
                      <Badge variant={statusInfo.badgeVariant} className={statusInfo.badgeClass}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {nda.companySignatureInfo && (
                        <div>
                          <span className="font-medium text-neutral-800">ممثل الشركة:</span>
                          <p className="text-neutral-600">{nda.companySignatureInfo.name}</p>
                        </div>
                      )}
                      
                      {nda.status === 'signed' && nda.signedAt && (
                        <div>
                          <span className="font-medium text-neutral-800">تاريخ التوقيع:</span>
                          <p className="text-neutral-600">
                            {new Date(nda.signedAt).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      
                      {nda.status === 'invitations_sent' && (
                        <div>
                          <span className="font-medium text-neutral-800">الحالة:</span>
                          <p className="text-blue-600">تم إرسال دعوات التوقيع عبر صادق</p>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-neutral-800">تاريخ الإنشاء:</span>
                        <p className="text-neutral-600">
                          {new Date(nda.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    
                    {nda.sadiqReferenceNumber && (
                      <div className="mt-3 pt-3 border-t border-neutral-200">
                        <div className="text-xs text-neutral-500">
                          رقم المرجع في صادق: {nda.sadiqReferenceNumber}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-600">
              لم يتم توقيع أي اتفاقية عدم إفصاح على هذا المشروع بعد.
            </p>
          </div>
        )}
      </div>
    );
  }

  // إذا كان المستخدم شركة ويمكنه توقيع اتفاقية عدم الإفصاح
  if (canSignNda) {
    // Check if this company has already signed an NDA for this project
    const currentCompanyNda = companyNda || (ndaId && hasSignedNda ? ndaData : null);
    
    return (
      <div className="mb-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <div className="flex items-start">
            <Lock className="h-6 w-6 text-amber-600 mt-1 ml-3 flex-shrink-0" />
            <div className="w-full">
              <h3 className="font-semibold text-amber-800 text-lg mb-2">هذا المشروع يتطلب اتفاقية عدم إفصاح</h3>
              
              {currentCompanyNda ? (
                <div>
                  {/* Company has signed - show status */}
                  <div className="mb-4">
                    {currentCompanyNda.status === 'signed' ? (
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                        <p className="text-green-700 font-medium">
                          تم توقيع الاتفاقية بنجاح! يمكنك الآن الاطلاع على تفاصيل المشروع وتقديم عرضك.
                        </p>
                      </div>
                    ) : currentCompanyNda.status === 'invitations_sent' ? (
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 text-blue-600 ml-2" />
                        <p className="text-blue-700 font-medium">
                          تم إرسال دعوة التوقيع الإلكتروني عبر صادق. تحقق من بريدك الإلكتروني لإكمال التوقيع.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 ml-2" />
                        <p className="text-amber-700 font-medium">
                          الاتفاقية قيد المعالجة...
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Status details */}
                  <div className="bg-white rounded-lg p-4 border border-amber-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-neutral-800">حالة الاتفاقية:</span>
                        <div className="mt-1">
                          {(() => {
                            const statusInfo = getStatusInfo(currentCompanyNda.status);
                            const StatusIcon = statusInfo.icon;
                            return (
                              <div className="flex items-center">
                                <StatusIcon className={`h-4 w-4 ${statusInfo.color} ml-2`} />
                                <Badge variant={statusInfo.badgeVariant} className={statusInfo.badgeClass}>
                                  {statusInfo.label}
                                </Badge>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {currentCompanyNda.signedAt && (
                        <div>
                          <span className="font-medium text-neutral-800">تاريخ التوقيع:</span>
                          <p className="text-neutral-600 mt-1">
                            {new Date(currentCompanyNda.signedAt).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-neutral-800">تاريخ الإنشاء:</span>
                        <p className="text-neutral-600 mt-1">
                          {new Date(currentCompanyNda.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      
                      {currentCompanyNda.sadiqReferenceNumber && (
                        <div>
                          <span className="font-medium text-neutral-800">رقم المرجع:</span>
                          <p className="text-neutral-600 mt-1 text-xs font-mono">
                            {currentCompanyNda.sadiqReferenceNumber}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {currentCompanyNda.status === 'invitations_sent' && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5 ml-2 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">خطوات إكمال التوقيع:</p>
                            <ol className="list-decimal list-inside space-y-1 text-blue-700">
                              <li>تحقق من بريدك الإلكتروني للحصول على دعوة صادق</li>
                              <li>انقر على الرابط في البريد الإلكتروني</li>
                              <li>أكمل عملية التوقيع الإلكتروني</li>
                              <li>ستتحدث حالة الاتفاقية تلقائياً عند اكتمال التوقيع</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Company hasn't signed - show sign option */}
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
        
        {/* مربع حوار توقيع اتفاقية عدم الإفصاح - only show if not signed */}
        {!currentCompanyNda && (
          <NdaDialog 
            projectId={projectId}
            projectTitle={projectTitle}
            isOpen={isNdaDialogOpen}
            onOpenChange={setIsNdaDialogOpen}
          />
        )}
      </div>
    );
  }

  return null;
}