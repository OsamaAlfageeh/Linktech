import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { RecommendedCompanies, SimilarProjects } from "@/components/recommendations";
import { 
  Calendar, 
  Clock, 
  Banknote, 
  ArrowLeft, 
  MessageSquare,
  AlertCircle
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
        <title>{project ? `${project.title} | تِكلينك` : 'تفاصيل المشروع | تِكلينك'}</title>
        <meta name="description" content={project?.description || 'تفاصيل المشروع'} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/projects" className="text-primary hover:text-primary-dark inline-flex items-center">
            <ArrowLeft className="ml-1 h-4 w-4 rtl-flip" />
            العودة إلى المشاريع
          </Link>
        </div>

        {isLoading ? (
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
            <Button onClick={() => window.location.reload()} variant="outline">إعادة المحاولة</Button>
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
                  <Link href={`/messages?userId=${project.userId}&projectId=${project.id}`}>
                    <Button>
                      <MessageSquare className="ml-2 h-4 w-4" />
                      تواصل مع صاحب المشروع
                    </Button>
                  </Link>
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
                    <Badge key={index} variant="outline" className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-lg">
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
                        className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 flex flex-col"
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

              {/* Owner info */}
              <div className="border-t border-neutral-200 pt-6">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 ml-3">
                    <AvatarImage src="" />
                    <AvatarFallback>{getInitials(project.name || "")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="text-sm text-neutral-600">صاحب المشروع</p>
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

        {/* Recommendations */}
        {project && (
          <div className="mt-10 space-y-12">
            {/* Recommended Companies */}
            <div className="mb-10">
              <RecommendedCompanies projectId={project.id} limit={3} />
            </div>
            
            {/* Similar Projects */}
            <div className="mb-6">
              <SimilarProjects projectId={project.id} limit={3} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectDetails;
