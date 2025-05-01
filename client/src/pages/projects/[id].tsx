import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { 
  AIProjectAnalysis
} from "@/components/recommendations";
import { CreateOfferForm } from "@/components/offers/CreateOfferForm";
import { OffersList } from "@/components/offers/OffersList";
import { useAuth } from "@/App";
import { 
  Calendar, 
  Clock, 
  Banknote, 
  ArrowLeft, 
  MessageSquare,
  AlertCircle,
  Settings,
  Plus
} from "lucide-react";

import { UploadedFile } from "@/components/ui/dropzone-uploader";

type Project = {
  id: number;
  title: string;
  description: string;
  budget: string;
  duration: string;
  skills: string[];
  status: string;
  highlightStatus?: string;
  userId: number;
  createdAt: string;
  username?: string;
  name?: string;
  attachments?: UploadedFile[];
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id);
  const [_, navigate] = useLocation();
  const auth = useAuth();

  const {
    data: project,
    isLoading,
    error,
  } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId && !isNaN(projectId),
  });
  
  // Check for invalid project ID
  useEffect(() => {
    if (!id || isNaN(parseInt(id))) {
      navigate("/not-found");
    }
  }, [id, navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <>
      <Helmet>
        <title>{project ? `${project.title} | لينكتك` : 'تفاصيل المشروع | لينكتك'}</title>
        <meta name="description" content={"تفاصيل المشروع متاحة للمستخدمين المسجلين فقط"} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/projects" className="text-primary hover:text-primary-dark inline-flex items-center">
            <ArrowLeft className="ml-1 h-4 w-4 rtl-flip" />
            العودة إلى المشاريع
          </Link>
        </div>
        
        {/* تحقق مما إذا كان المستخدم مسجل دخول */}
        {!auth.isAuthenticated && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
            <h2 className="text-xl font-bold mb-4">تفاصيل المشروع متاحة للمستخدمين المسجلين فقط</h2>
            <p className="text-neutral-600 mb-6">لحماية خصوصية المشاريع، يمكن مشاهدة تفاصيل المشاريع المتاحة فقط للمستخدمين المسجلين.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/login">
                <Button className="w-full sm:w-auto">تسجيل الدخول</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" className="w-full sm:w-auto">إنشاء حساب جديد</Button>
              </Link>
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-primary mb-2">لماذا يجب عليك التسجيل؟</h3>
              <ul className="text-sm text-neutral-700 text-right list-disc list-inside space-y-1">
                <li>الاطلاع على تفاصيل جميع المشاريع المتاحة</li>
                <li>التواصل مع أصحاب المشاريع</li>
                <li>تقديم عروض على المشاريع التي تناسب خبراتك</li>
                <li>متابعة حالة العروض المقدمة منك</li>
              </ul>
            </div>
          </div>
        )}

        {auth.isAuthenticated && 
          isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <Skeleton className="h-10 w-3/4 mb-6" />
              <div className="flex flex-wrap gap-2 mb-6">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-32 w-full mb-6" />
              <div className="flex flex-wrap gap-2 mb-6">
                <Skeleton className="h-7 w-24 rounded" />
                <Skeleton className="h-7 w-20 rounded" />
                <Skeleton className="h-7 w-28 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
              <div className="border-t border-neutral-200 pt-6">
                <Skeleton className="h-14 w-full md:w-1/3" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">لا يمكن تحميل تفاصيل المشروع</h2>
            <p className="text-neutral-600 mb-6">حدث خطأ أثناء محاولة تحميل بيانات المشروع. يرجى المحاولة مرة أخرى لاحقًا.</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="hover-button-scale transition-all duration-300 pulse-effect"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              إعادة المحاولة
            </Button>
          </div>
        ) : project ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold font-heading mb-2">{project.title}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    {project.highlightStatus && (
                      <Badge className="bg-accent text-white font-medium">
                        {project.highlightStatus}
                      </Badge>
                    )}
                    <span className="text-neutral-600 flex items-center text-sm">
                      <Clock className="inline-block ml-1 h-4 w-4" />
                      نُشر {formatDate(project.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  {auth.isAuthenticated && auth.user?.id !== project.userId && (
                    <Link href={`/messages?userId=${project.userId}&projectId=${project.id}`}>
                      <Button className="hover-button-scale transition-all duration-300 hover:shadow-md">
                        <MessageSquare className="ml-2 h-4 w-4 rtl-flip transition-transform group-hover:scale-110" />
                        <span className="relative">
                          تواصل مع صاحب المشروع
                          <span className="absolute -bottom-1 right-0 w-full h-0.5 bg-white/70 transform scale-x-0 transition-transform duration-300 origin-right group-hover:scale-x-100"></span>
                        </span>
                      </Button>
                    </Link>
                  )}
                  {auth.isAuthenticated && auth.user?.id === project.userId && (
                    <Link href={`/dashboard/entrepreneur?tab=projects&action=edit&projectId=${project.id}`}>
                      <Button className="hover-button-scale transition-all duration-300 hover:shadow-md">
                        <Settings className="ml-2 h-4 w-4 rtl-flip transition-transform group-hover:scale-110" />
                        <span className="relative">
                          تعديل هذا المشروع
                          <span className="absolute -bottom-1 right-0 w-full h-0.5 bg-white/70 transform scale-x-0 transition-transform duration-300 origin-right group-hover:scale-x-100"></span>
                        </span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold font-heading mb-3">تفاصيل المشروع</h2>
                <p className="text-neutral-700 whitespace-pre-line">{project.description}</p>
              </div>

              {/* Skills */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold font-heading mb-3">المهارات المطلوبة</h2>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-lg transition-all duration-300 hover:bg-neutral-200 hover:shadow-sm hover:translate-y-[-2px] badge-pulse"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Project Attachments */}
              {project.attachments && project.attachments.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold font-heading mb-3">مرفقات المشروع</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {project.attachments.map((attachment) => (
                      <div 
                        key={attachment.id}
                        className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 flex flex-col transform transition-all duration-300 hover:shadow-md hover:translate-y-[-3px]"
                      >
                        {attachment.type.startsWith('image/') ? (
                          <div className="h-40 overflow-hidden bg-white">
                            <img 
                              src={attachment.url} 
                              alt={attachment.name} 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="h-40 flex items-center justify-center bg-neutral-100">
                            <div className="text-center p-4">
                              <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
                                {attachment.type.includes('pdf') ? (
                                  <span className="text-red-500 text-xs font-semibold">PDF</span>
                                ) : attachment.type.includes('word') || attachment.type.includes('doc') ? (
                                  <span className="text-blue-500 text-xs font-semibold">DOC</span>
                                ) : attachment.type.includes('sheet') || attachment.type.includes('xls') ? (
                                  <span className="text-green-500 text-xs font-semibold">XLS</span>
                                ) : (
                                  <span className="text-neutral-500 text-xs font-semibold">FILE</span>
                                )}
                              </div>
                              <span className="text-sm text-neutral-700 line-clamp-1">{attachment.name}</span>
                            </div>
                          </div>
                        )}
                        <div className="p-3 bg-white flex justify-between items-center mt-auto">
                          <span className="text-xs text-neutral-500">
                            {(attachment.size / 1024).toFixed(0)} كيلوبايت
                          </span>
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:text-primary-dark font-medium hover:underline"
                          >
                            عرض الملف
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <h3 className="text-neutral-600 text-sm mb-1">الميزانية المتوقعة</h3>
                  <div className="flex items-center">
                    <Banknote className="text-[hsl(160,84%,39%)] h-5 w-5 ml-2" />
                    <span className="text-lg font-semibold">{project.budget}</span>
                  </div>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <h3 className="text-neutral-600 text-sm mb-1">المدة المتوقعة</h3>
                  <div className="flex items-center">
                    <Calendar className="text-primary h-5 w-5 ml-2" />
                    <span className="text-lg font-semibold">{project.duration}</span>
                  </div>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <h3 className="text-neutral-600 text-sm mb-1">حالة المشروع</h3>
                  <div className="flex items-center">
                    <Badge className={
                      project.status === "open" 
                        ? "bg-green-100 text-green-800 hover:bg-green-100" 
                        : "bg-neutral-100 text-neutral-800 hover:bg-neutral-100"
                    }>
                      {project.status === "open" ? "مفتوح" : "مغلق"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* AI Project Analysis - visible only for project owners and admins */}
              {auth.isAuthenticated && (auth.user?.id === project.userId || auth.user?.role === "admin") && (
                <div className="mb-8">
                  <AIProjectAnalysis projectId={project.id} />
                </div>
              )}

            {/* Owner info */}
              <div className="border-t border-neutral-200 pt-6">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 ml-3">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {auth.isAuthenticated && auth.user?.role === "company" 
                        ? project.name?.charAt(0) || "م"
                        : getInitials(project.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    {auth.isAuthenticated && auth.user?.role === "company" ? (
                      <div>
                        <h3 className="font-semibold blur-text">
                          {project.name?.substring(0, 1)}****{" "}
                          <span className="text-xs bg-amber-100 text-amber-700 rounded px-2 py-0.5">
                            تظهر البيانات بعد قبول العرض
                          </span>
                        </h3>
                        <p className="text-sm text-neutral-600">صاحب المشروع</p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-neutral-600">صاحب المشروع</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">لم يتم العثور على المشروع</h2>
            <p className="text-neutral-600 mb-6">لا يمكن العثور على المشروع المطلوب. قد يكون تم حذفه أو أن الرابط غير صحيح.</p>
            <Link href="/projects">
              <Button>عرض المشاريع المتاحة</Button>
            </Link>
          </div>
        )}

        {/* Project Offers Section */}
        {project && (
          <div className="mt-10 mb-10">
            {/* Show offers only if project is open */}
            {project.status === "open" && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-6 md:p-8">
                  <h2 className="text-2xl font-bold font-heading mb-6">عروض الشركات</h2>
                  
                  {/* For companies: Show the form to submit a new offer */}
                  {auth.isAuthenticated && auth.user?.role === "company" && auth.user?.id !== project.userId && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">قدم عرضك على هذا المشروع</h3>
                      </div>
                      
                      <CreateOfferForm projectId={project.id} />
                    </div>
                  )}
                  
                  {/* Display offers list */}
                  <div className="mt-8">
                    <OffersList 
                      projectId={project.id} 
                      isOwner={auth.isAuthenticated && (auth.user?.id === project.userId || auth.user?.role === "admin")}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {project.status !== "open" && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden p-6 md:p-8 text-center">
                <h2 className="text-xl font-semibold text-neutral-700 mb-3">هذا المشروع مغلق للعروض الجديدة</h2>
                <p className="text-neutral-600">تم إغلاق هذا المشروع أو تعيينه إلى إحدى الشركات بالفعل.</p>
              </div>
            )}
          </div>
        )}


      </div>
    </>
  );
};

export default ProjectDetails;
