import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Info, CheckCircle, Clock, AlertCircle, Users, ExternalLink, RefreshCw } from "lucide-react";
import { NdaDialog } from "./NdaDialog";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";

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
    case 'invitation_sent':
      return {
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'تم إرسال الدعوة - تحقق من بريدك الإلكتروني',
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

  // Check if there's a pending NDA that needs entrepreneur data
  const {
    data: pendingNdaStatus,
    isLoading: isCheckingPendingNda,
  } = useQuery<{ status: string; ndaId: number }>({
    queryKey: [`/api/nda/status/${projectId}`],
    enabled: !!projectId && userRole === 'entrepreneur' && currentUserId === userId,
  });

  // إذا كان المستخدم هو صاحب المشروع أو شركة، نقوم بجلب جميع اتفاقيات المشروع
  const {
    data: projectNdas,
    isLoading: isLoadingProjectNdas,
    refetch: refetchProjectNdas,
  } = useQuery<NdaAgreement[]>({
    queryKey: [`/api/projects/${projectId}/nda`],
    enabled: !!projectId && (userRole === 'admin' || currentUserId === userId || userRole === 'company'), // المسؤولون أو صاحب المشروع أو الشركات
    staleTime: 0, // Always refetch to get latest status
  });

  // جلب ملف تعريف الشركة للتحقق من حالة التوثيق
  const {
    data: companyProfile,
    isLoading: isLoadingCompanyProfile,
  } = useQuery({
    queryKey: [`/api/companies/user/${currentUserId}`],
    enabled: !!currentUserId && userRole === 'company',
    staleTime: 0,
  });

  // التحقق مما إذا كان المستخدم شركة ويمكنه توقيع اتفاقية عدم الإفصاح
  const canSignNda = userRole === 'company' && currentUserId !== userId;
  
  // التحقق من حالة توثيق الشركة
  const isCompanyVerified = (companyProfile as any)?.verified === true;
  
  // Fetch Sadiq NDA status if we have a reference number
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    data: sadiqStatus, 
    refetch: refetchSadiqStatus,
    isRefetching: isRefetchingSadiqStatus 
  } = useQuery<{data: any}>({
    queryKey: ['sadiqNdaStatus', ndaData?.sadiqReferenceNumber],
    queryFn: async () => {
      if (!ndaData?.sadiqReferenceNumber) return null;
      
      try {
        const response = await fetch(`/api/sadiq/nda-status/${ndaData.sadiqReferenceNumber}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('فشل في جلب حالة الاتفاقية من صادق');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching Sadiq NDA status:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في جلب حالة التوقيع من منصة صادق',
          variant: 'destructive'
        });
        return null;
      }
    },
    enabled: !!ndaData?.sadiqReferenceNumber,
    refetchOnWindowFocus: false
  });

  // Auto-refresh Sadiq status every 30 seconds
  useEffect(() => {
    if (ndaData?.sadiqReferenceNumber) {
      const interval = setInterval(() => {
        refetchSadiqStatus();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [ndaData?.sadiqReferenceNumber, refetchSadiqStatus]);

  // Debug logging
  console.log('NDA Section Debug:', {
    currentUserId,
    userRole,
    companyProfile,
    isCompanyVerified,
    canSignNda,
    sadiqStatus
  });

  // التحقق مما إذا كان المستخدم الحالي هو صاحب المشروع
  const isProjectOwner = currentUserId === userId;

  // التحقق مما إذا كان المستخدم مسؤول
  const isAdmin = userRole === 'admin';

  // Check if current user (company) has signed NDA for this project
  const companyNda = projectNdas?.find(nda => 
    nda.companySignatureInfo?.companyUserId === currentUserId
  );
  
  // For companies: check if they already created an NDA (regardless of status)
  const hasCompanyCreatedNda = !!companyNda;
  
  // For companies: check if they already signed or have invitation sent
  const hasCompanySignedNda = !!companyNda && (companyNda.status === 'signed' || companyNda.status === 'invitations_sent');
  
  // For specific NDA: check if it exists
  const hasSignedNda = !!ndaData;

  // Check if entrepreneur needs to complete NDA data
  const entrepreneurNeedsToComplete = isProjectOwner && 
    pendingNdaStatus?.status === 'awaiting_entrepreneur';

  // عندما لا يتطلب المشروع اتفاقية عدم إفصاح أو المستخدم ليس شركة، لا نعرض شيئاً
  if (!requiresNda && !isProjectOwner && !isAdmin) {
    return null;
  }

  // Show prominent alert if entrepreneur needs to complete NDA data
  if (entrepreneurNeedsToComplete && !isCheckingPendingNda) {
    return (
      <div className="mb-8">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5 animate-pulse-border">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-red-600 mt-1 ml-3 flex-shrink-0 animate-bounce" />
            <div className="w-full">
              <h3 className="font-bold text-red-800 text-lg mb-2">
                ⚠️ مطلوب: إكمال بيانات اتفاقية عدم الإفصاح
              </h3>
              <p className="text-red-700 mb-4">
                لديك طلب اتفاقية عدم إفصاح من إحدى الشركات المهتمة بمشروعك. 
                يجب عليك إكمال بياناتك لتفعيل عملية التوقيع الإلكتروني عبر منصة صادق.
              </p>
              
              <div className="bg-white rounded-lg p-4 border border-red-200 mb-4">
                <h4 className="font-semibold text-neutral-800 mb-2">لماذا هذا مهم؟</h4>
                <ul className="space-y-2 text-sm text-neutral-700">
                  <li className="flex items-start">
                    <Shield className="h-4 w-4 text-red-500 ml-2 mt-0.5 flex-shrink-0" />
                    <span>حماية معلومات مشروعك السرية من خلال اتفاقية قانونية ملزمة</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-red-500 ml-2 mt-0.5 flex-shrink-0" />
                    <span>السماح للشركة بالاطلاع على تفاصيل المشروع الكاملة</span>
                  </li>
                  <li className="flex items-start">
                    <Users className="h-4 w-4 text-red-500 ml-2 mt-0.5 flex-shrink-0" />
                    <span>بناء الثقة المتبادلة بينك وبين الشركة المهتمة</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => window.location.href = `/nda-complete?projectId=${projectId}&ndaId=${pendingNdaStatus.ndaId}`}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  size="lg"
                >
                  <Shield className="ml-2 h-5 w-5" />
                  إكمال البيانات الآن
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/notifications'}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  عرض الإشعارات
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show verification required message for unverified companies
  if (canSignNda && !isLoadingCompanyProfile && companyProfile && !isCompanyVerified) {
    return (
      <div className="mb-8">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-amber-600 mt-1 ml-3 flex-shrink-0" />
            <div className="w-full">
              <h3 className="font-bold text-amber-800 text-lg mb-3">
                🔒 توثيق الشركة مطلوب
              </h3>
              <p className="text-amber-700 mb-4 text-base">
                يجب توثيق شركتك من قبل الإدارة قبل أن تتمكن من توقيع اتفاقيات عدم الإفصاح والمشاركة في المشاريع.
              </p>
              
              <div className="bg-white rounded-lg p-4 border border-amber-200 mb-4">
                <h4 className="font-semibold text-neutral-800 mb-3">خطوات التوثيق:</h4>
                <ol className="space-y-2 text-sm text-neutral-700 list-decimal list-inside">
                  <li>تأكد من اكتمال جميع البيانات المطلوبة في ملف تعريف الشركة</li>
                  <li>رفع المستندات المطلوبة (السجل التجاري، الترخيص، إلخ)</li>
                  <li>انتظار مراجعة الإدارة وتوثيق الشركة</li>
                  <li>ستتلقى إشعاراً عند اكتمال التوثيق</li>
                </ol>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => window.location.href = '/dashboard/company'}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  size="lg"
                >
                  <Shield className="ml-2 h-5 w-5" />
                  إكمال ملف تعريف الشركة
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/contact'}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Info className="ml-2 h-4 w-4" />
                  التواصل مع الإدارة
                </Button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>ملاحظة:</strong> عملية التوثيق قد تستغرق من 1-3 أيام عمل. 
                  يمكنك متابعة حالة التوثيق من لوحة التحكم.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // إذا كان المستخدم صاحب المشروع، نعرض قائمة بالشركات التي وقعت اتفاقية عدم الإفصاح
  if (isProjectOwner || isAdmin) {
    return (
      <div className="mb-8 bg-white p-5 rounded-lg border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-primary ml-2" />
            <h2 className="text-xl font-semibold">اتفاقيات عدم الإفصاح</h2>
          </div>
          {projectNdas && projectNdas.length > 0 && projectNdas.some(nda => nda.sadiqEnvelopeId) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open the first NDA with Sadiq envelope ID
                const ndaWithSadiq = projectNdas.find(nda => nda.sadiqEnvelopeId);
                if (ndaWithSadiq) {
                  const sadiqUrl = `https://launchtech-sandbox.sadq.sa/sign/DocumentInfo/${ndaWithSadiq.sadiqEnvelopeId}`;
                  window.open(sadiqUrl, '_blank');
                }
              }}
              className="text-sm"
            >
              <ExternalLink className="h-4 w-4 ml-1" />
              عرض في صادق
            </Button>
          )}
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
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs text-neutral-500">
                            رقم المرجع في صادق: {nda.sadiqReferenceNumber}
                          </div>
                            <Button
                            variant="ghost"
                            size="default"
                            onClick={() => {
                              refetchSadiqStatus();
                              toast({
                                title: 'جاري التحديث',
                                description: 'جاري تحديث حالة التوقيع...'
                              });
                            }}
                            className="h-8 px-2 text-xs"
                          >
                            <RefreshCw className={`h-3 w-3 ml-1 ${isRefetchingSadiqStatus ? 'animate-spin' : ''}`} />
                            تحديث
                          </Button>
                        </div>
                        
                        {/* Sadiq Status */}
                        {sadiqStatus?.data && (
                          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-100">
                            <div className="flex items-center text-sm text-blue-800 mb-1">
                              <Shield className="h-3.5 w-3.5 ml-1" />
                              <span>حالة التوقيع:</span>
                              <span className="font-medium mr-1">
                                {sadiqStatus.data.status === 'In-progress' ? 'قيد التنفيذ' : 
                                 sadiqStatus.data.status === 'completed' ? 'مكتمل' : 
                                 sadiqStatus.data.status}
                              </span>
                            </div>
                            
                            {sadiqStatus.data.signingStats && (
                              <div className="text-xs text-blue-700">
                                <div className="flex items-center justify-between mb-1">
                                  <span>نسبة الإكمال:</span>
                                  <span className="font-medium">
                                    {sadiqStatus.data.signingStats.completionPercentage}%
                                  </span>
                                </div>
                                <div className="w-full bg-blue-100 rounded-full h-1.5">
                                  <div 
                                    className="bg-blue-600 h-1.5 rounded-full" 
                                    style={{ width: `${sadiqStatus.data.signingStats.completionPercentage}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {nda.sadiqEnvelopeId && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const sadiqUrl = `https://launchtech-sandbox.sadq.sa/sign/DocumentInfo/${nda.sadiqEnvelopeId}`;
                                window.open(sadiqUrl, '_blank');
                              }}
                              className="text-xs flex-1"
                            >
                              <ExternalLink className="h-3 w-3 ml-1" />
                              فتح في صادق
                            </Button>
                          </div>
                        )}
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
    // Check if this company has already created an NDA for this project
    const currentCompanyNda = companyNda;
    
    return (
      <div className="mb-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <div className="flex items-start">
            <Lock className="h-6 w-6 text-amber-600 mt-1 ml-3 flex-shrink-0" />
            <div className="w-full">
              <h3 className="font-semibold text-amber-800 text-lg mb-2">هذا المشروع يتطلب اتفاقية عدم إفصاح</h3>
              
              {companyNda ? (
                <div>
                  {/* Company has signed - show status */}
                  <div className="mb-4">
                    {companyNda.status === 'signed' ? (
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                        <p className="text-green-700 font-medium">
                          تم توقيع الاتفاقية بنجاح! يمكنك الآن الاطلاع على تفاصيل المشروع وتقديم عرضك.
                        </p>
                      </div>
                    ) : companyNda.status === 'invitations_sent' ? (
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 text-blue-600 ml-2" />
                        <p className="text-blue-700 font-medium">
                          تم إرسال دعوة التوقيع الإلكتروني إلى بريدك الإلكتروني. يرجى التحقق من بريدك وتوقيع الاتفاقية عبر منصة صادق.
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
                            const statusInfo = getStatusInfo(companyNda.status);
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
                      
                      {companyNda.signedAt && (
                        <div>
                          <span className="font-medium text-neutral-800">تاريخ التوقيع:</span>
                          <p className="text-neutral-600 mt-1">
                            {new Date(companyNda.signedAt).toLocaleDateString('ar-SA', {
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
                          {new Date(companyNda.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      
                      {companyNda.sadiqReferenceNumber && (
                        <div>
                          <span className="font-medium text-neutral-800">رقم المرجع:</span>
                          <p className="text-neutral-600 mt-1 text-xs font-mono">
                            {companyNda.sadiqReferenceNumber}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {companyNda.status === 'invitations_sent' && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5 ml-2 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">الحالة الحالية:</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-700">
                              <li>✅ تم إكمال بياناتك بنجاح</li>
                              <li>📧 تم إرسال دعوة التوقيع إلى بريدك الإلكتروني</li>
                              <li>🔐 يرجى التحقق من بريدك وتوقيع الاتفاقية عبر منصة صادق</li>
                              <li>⏰ بعد التوقيع، ستتمكن من الاطلاع على تفاصيل المشروع الكاملة</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Company hasn't created NDA yet - show sign option */}
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
                    إكمال بيانات اتفاقية عدم الإفصاح
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* مربع حوار توقيع اتفاقية عدم الإفصاح - only show if not created */}
        {!hasCompanyCreatedNda && (
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