import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ProjectCard from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, PlusCircle } from "lucide-react";
import SEO from "@/components/seo/SEO";
import { WebpageStructuredData, BreadcrumbStructuredData } from "@/components/seo/StructuredData";
import { useAuth } from "@/App";

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
  name?: string;
  createdAt?: string; // Make createdAt optional
};

type ProjectsProps = {
  auth?: {
    isAuthenticated: boolean;
    isEntrepreneur: boolean;
  };
};

const ProjectSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-1/6 rounded-full" />
      </div>
      <Skeleton className="h-16 w-full mb-4" />
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-6 w-24 rounded" />
      </div>
      <div className="flex justify-between items-center text-sm border-t border-neutral-200 pt-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-1/4" />
      </div>
    </div>
    <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200">
      <Skeleton className="h-5 w-28" />
    </div>
  </div>
);

const Projects = ({ auth: authProp }: ProjectsProps = {}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Use the auth hook directly for reliable state
  const auth = useAuth();

  const { data: projects, isLoading, error, refetch } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    // Query is always enabled, we handle auth in the UI rendering
    enabled: true
  });
  
  // إعادة جلب البيانات عند تغير حالة المصادقة
  useEffect(() => {
    if (auth.isAuthenticated) {
      console.log('إعادة جلب المشاريع بعد تغير حالة المصادقة');
      refetch();
    }
  }, [auth.isAuthenticated, refetch]);

  // Filter and sort projects
  const filteredProjects = projects
    ? projects.filter((project: Project) => {
        const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             project.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesSkill = selectedSkill === "_all" || selectedSkill === ""
          ? true
          : (project.skills || []).some((skill: string) => skill.toLowerCase() === selectedSkill.toLowerCase());
        
        return matchesSearch && matchesSkill;
      })
    : [];

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === "newest") {
      // Safely handle createdAt that might not exist in the type but exists in the data
      const aDate = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
      return bDate - aDate;
    } else if (sortBy === "oldest") {
      const aDate = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
      return aDate - bDate;
    } else if (sortBy === "budget-high") {
      const aBudget = parseInt(a.budget.replace(/[^0-9]/g, ''));
      const bBudget = parseInt(b.budget.replace(/[^0-9]/g, ''));
      return bBudget - aBudget;
    } else if (sortBy === "budget-low") {
      const aBudget = parseInt(a.budget.replace(/[^0-9]/g, ''));
      const bBudget = parseInt(b.budget.replace(/[^0-9]/g, ''));
      return aBudget - bBudget;
    }
    return 0;
  });

  // Extract unique skills from all projects (filter out empty strings)
  const allSkills = projects
    ? Array.from(new Set(projects.flatMap((project: Project) => project.skills || []).filter(skill => skill && skill.trim() !== "")))
    : [];

  return (
    <>
      <SEO 
        title={auth.isEntrepreneur ? "مشاريعي | لينكتك" : "المشاريع | لينكتك"}
        description={auth.isEntrepreneur 
          ? "إدارة ومتابعة مشاريعك الخاصة وحالة العروض المقدمة عليها في منصة لينكتك."
          : "استعرض أحدث المشاريع التقنية المتاحة للتنفيذ من قبل شركات البرمجة والمطورين المحترفين في المملكة العربية السعودية. فرص متنوعة للشركات من مختلف التخصصات التقنية."
        }
        keywords="مشاريع برمجية, مشاريع تقنية, تطوير مواقع, تطوير تطبيقات, برمجة تطبيقات, برمجة مواقع, مطورين, شركات برمجة"
        ogType="website"
      >
        <WebpageStructuredData
          name="قائمة المشاريع التقنية | لينكتك"
          description="استعرض أحدث المشاريع التقنية المتاحة للتنفيذ من قبل شركات البرمجة والمطورين المحترفين"
          url="https://linktech.app/projects"
        />
        <BreadcrumbStructuredData
          items={[
            { name: "الرئيسية", url: "https://linktech.app/" },
            { name: "المشاريع", url: "https://linktech.app/projects" }
          ]}
        />
      </SEO>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-1 sm:mb-2">
            {auth.isEntrepreneur ? 'مشاريعي' : 'المشاريع'}
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base">
            {auth.isEntrepreneur 
              ? 'إدارة ومتابعة مشاريعك الخاصة وحالة العروض المقدمة عليها'
              : 'استعرض أحدث المشاريع التقنية المتاحة للتنفيذ من قبل شركات البرمجة'
            }
          </p>
        </div>

        {auth.isAuthenticated ? (
          <>
            {/* Filters and Controls */}
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-neutral-200 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      placeholder="البحث عن مشروع..."
                      className="pl-3 pr-9 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                    <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
                      <SelectValue placeholder="التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">جميع التصنيفات</SelectItem>
                      {allSkills.map((skill: string, index: number) => (
                        <SelectItem key={index} value={skill}>{skill}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
                      <SelectValue placeholder="الترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">الأحدث</SelectItem>
                      <SelectItem value="oldest">الأقدم</SelectItem>
                      <SelectItem value="budget-high">الميزانية (الأعلى)</SelectItem>
                      <SelectItem value="budget-low">الميزانية (الأقل)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {auth.isAuthenticated && auth.isEntrepreneur && (
                <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-center sm:justify-start">
                  <Link href="/dashboard/entrepreneur?action=create-project">
                    <Button className="w-full sm:w-auto text-sm sm:text-base">
                      <PlusCircle className="ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 group-hover:scale-110" />
                      إضافة مشروع جديد
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Projects Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <ProjectSkeleton />
                <ProjectSkeleton />
                <ProjectSkeleton />
                <div className="hidden sm:block">
                  <ProjectSkeleton />
                </div>
                <div className="hidden sm:block">
                  <ProjectSkeleton />
                </div>
                <div className="hidden sm:block">
                  <ProjectSkeleton />
                </div>
              </div>
            ) : error ? (
              <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
                <p className="text-neutral-600 text-sm sm:text-base">حدث خطأ أثناء تحميل المشاريع. حاول مرة أخرى لاحقاً.</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="mt-3 sm:mt-4 text-xs sm:text-sm"
                >
                  إعادة المحاولة
                </Button>
              </div>
            ) : sortedProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {sortedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
                <p className="text-neutral-600 text-sm sm:text-base mb-1 sm:mb-2">
                  {auth.isEntrepreneur 
                    ? 'لم تقم بإنشاء أي مشاريع بعد.'
                    : 'لا توجد مشاريع متطابقة مع معايير البحث.'
                  }
                </p>
                <p className="text-neutral-500 text-xs sm:text-sm mb-3 sm:mb-4">
                  {auth.isEntrepreneur 
                    ? 'ابدأ بإضافة مشروعك الأول واربطه مع أفضل شركات البرمجة.'
                    : 'حاول تغيير معايير البحث أو التصفية.'
                  }
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSkill("");
                    setSortBy("newest");
                  }} 
                  variant="outline"
                  className="text-xs sm:text-sm"
                >
                  إعادة ضبط عوامل التصفية
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
            <h2 className="text-xl font-bold mb-4">هذه الصفحة متاحة فقط للمستخدمين المسجلين</h2>
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
      </div>
    </>
  );
};

export default Projects;
