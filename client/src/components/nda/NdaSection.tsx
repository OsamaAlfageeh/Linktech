import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Info, ExternalLink, FileText, Download } from "lucide-react";
import { NdaDialog } from "./NdaDialog";

// تعريف نوع البيانات الخاص باتفاقية عدم الإفصاح
interface NdaAgreement {
  id: number;
  projectId: number;
  status: string;
  pdfUrl: string | null;
  createdAt: string;
  signedAt: string | null;
  expiresAt: string | null;
  companySignatureInfo: {
    signerName: string;
    signerTitle: string;
    signerIp: string;
    companyName?: string;
    timestamp: string;
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
              {projectNdas?.map((nda: NdaAgreement) => (
                <div 
                  key={nda.id} 
                  className="border border-neutral-200 rounded p-3 bg-neutral-50 flex justify-between items-start"
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
                      تاريخ التوقيع: {nda.signedAt ? new Date(nda.signedAt).toLocaleDateString('ar-SA') : 'غير متوفر'}
                    </div>
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-primary text-xs border-primary/30 hover:bg-primary/5"
                        onClick={() => {
                          console.log("تم النقر على زر تنزيل PDF للاتفاقية رقم:", nda.id);
                          
                          // استخدام apiRequest بدلاً من window.open المباشر للحفاظ على رمز الجلسة
                          const handlePdfDownload = async () => {
                            try {
                              console.log("بدء طلب تنزيل PDF...");
                              const response = await fetch(`/api/nda/${nda.id}/download-pdf`, {
                                method: 'GET',
                                credentials: 'include',
                              });
                              
                              console.log("استجابة الخادم:", response.status, response.statusText);
                              console.log("نوع المحتوى:", response.headers.get('content-type'));
                              
                              if (!response.ok) {
                                throw new Error(`خطأ في التنزيل: ${response.statusText}`);
                              }
                              
                              // تحويل الاستجابة إلى blob
                              console.log("تحويل الاستجابة إلى blob...");
                              const blob = await response.blob();
                              console.log("نوع البلوب:", blob.type, "حجم البلوب:", blob.size);
                              
                              // إنشاء URL للبلوب
                              const url = window.URL.createObjectURL(blob);
                              console.log("تم إنشاء URL للبلوب:", url);
                              
                              // إنشاء رابط مؤقت لتنزيل الملف
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `اتفاقية-عدم-إفصاح-${nda.id}.pdf`;
                              console.log("تم تعيين اسم الملف للتنزيل:", a.download);
                              
                              // طريقة بديلة (1) - توفير خيارات إضافية
                              a.target = '_blank';
                              a.rel = 'noopener noreferrer';
                              a.style.display = 'none';
                              
                              console.log("إضافة عنصر الرابط للصفحة والنقر عليه...");
                              document.body.appendChild(a);
                              a.click();
                              
                              // تنظيف بعد التنزيل
                              console.log("تنظيف الموارد بعد التنزيل...");
                              setTimeout(() => {
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                                console.log("اكتمل التنزيل وتم تنظيف الموارد");
                              }, 100);
                            } catch (error) {
                              console.error('خطأ في تنزيل ملف PDF:', error);
                              alert('حدث خطأ أثناء محاولة تنزيل ملف الاتفاقية. يرجى المحاولة مرة أخرى.');
                            }
                          };
                          
                          // استخدام طريقة مختلفة - تنزيل مباشر عن طريق iframe
                          if (confirm('هل تريد تنزيل ملف PDF لاتفاقية عدم الإفصاح؟')) {
                            // إنشاء iframe مؤقت للتنزيل
                            const iframe = document.createElement('iframe');
                            iframe.style.display = 'none';
                            iframe.src = `/api/nda/${nda.id}/download-pdf?t=${Date.now()}`;
                            document.body.appendChild(iframe);
                            
                            // إزالة iframe بعد التنزيل
                            setTimeout(() => {
                              document.body.removeChild(iframe);
                              console.log('تمت إزالة iframe بعد التنزيل');
                            }, 5000);
                          }
                        }}
                      >
                        <FileText className="h-3 w-3 ml-1" />
                        تنزيل الاتفاقية (PDF)
                      </Button>
                    </div>
                  </div>
                  <Badge variant={nda.status === 'active' ? 'secondary' : 'outline'} 
                    className={nda.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
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
                      <Badge variant={ndaData?.status === 'active' ? 'secondary' : 'outline'}
                        className={ndaData?.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                        {ndaData?.status === 'active' ? 'سارية' : 'معلقة'}
                      </Badge>
                    </div>
                    <div className="flex items-center mt-2 space-x-3 space-x-reverse">
                      {ndaData?.pdfUrl && (
                        <a 
                          href={ndaData.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 ml-1" />
                          عرض نسخة PDF
                        </a>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary text-xs hover:bg-primary/5 h-7 px-2"
                        onClick={() => {
                          if (!ndaData?.id) return;
                          
                          console.log("تم النقر على زر تنزيل PDF للاتفاقية رقم:", ndaData.id);
                          
                          // استخدام طريقة مختلفة - تنزيل مباشر عن طريق iframe
                          if (confirm('هل تريد تنزيل ملف PDF لاتفاقية عدم الإفصاح؟')) {
                            // إنشاء iframe مؤقت للتنزيل
                            const iframe = document.createElement('iframe');
                            iframe.style.display = 'none';
                            iframe.src = `/api/nda/${ndaData.id}/download-pdf?t=${Date.now()}`;
                            document.body.appendChild(iframe);
                            
                            // إزالة iframe بعد التنزيل
                            setTimeout(() => {
                              document.body.removeChild(iframe);
                              console.log('تمت إزالة iframe بعد التنزيل');
                            }, 5000);
                          }
                        }}
                      >
                        <Download className="h-3 w-3 ml-1" />
                        تنزيل الاتفاقية
                      </Button>
                    </div>
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
                  
                  {/* التحقق من استكمال البيانات الشخصية */}
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <Info className="h-5 w-5 ml-2 text-blue-600" />
                      متطلبات توقيع اتفاقية عدم الإفصاح
                    </h4>
                    <p className="text-blue-700 mb-3 text-sm">
                      لتوقيع اتفاقية عدم الإفصاح، يجب عليك استكمال بياناتك الشخصية أولاً:
                    </p>
                    <ul className="text-sm text-blue-700 list-disc list-inside mb-3">
                      <li>الاسم الكامل</li>
                      <li>رقم الهوية الوطنية</li>
                      <li>رقم الجوال</li>
                      <li>تاريخ الميلاد</li>
                      <li>العنوان الوطني</li>
                    </ul>
                    <Link href="/dashboard/company?tab=personal">
                      <Button
                        variant="outline"
                        className="bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        استكمال بياناتك الشخصية
                      </Button>
                    </Link>
                  </div>
                  
                  <Button 
                    onClick={() => setIsNdaDialogOpen(true)}
                    className="bg-gradient-to-l from-blue-600 to-primary hover:from-blue-700 hover:to-primary-dark"
                    disabled={true} // سيتم تفعيله عندما يتم التحقق من اكتمال البيانات الشخصية
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