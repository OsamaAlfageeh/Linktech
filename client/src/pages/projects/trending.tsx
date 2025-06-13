import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Calendar, Eye, Users } from "lucide-react";
import { Link } from "wouter";
import SEO from "@/components/seo/SEO";

interface Project {
  id: number;
  title: string;
  description: string;
  budget: string;
  duration: string;
  skills: string[];
  status: string;
  highlightStatus?: string;
  createdAt: string;
  userId: number;
}

const ProjectCard = ({ project }: { project: Project }) => {
  return (
    <Card className="overflow-hidden border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="text-right font-bold text-lg leading-tight line-clamp-2">
            {project.title}
          </CardTitle>
          <Badge variant={project.highlightStatus === 'عالي الطلب' ? 'destructive' : 'secondary'} className="shrink-0">
            {project.highlightStatus || project.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {project.description}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">الميزانية:</span>
            <span className="font-semibold text-primary">{project.budget}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">المدة المتوقعة:</span>
            <span className="font-medium">{project.duration}</span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {project.skills?.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {skill}
              </Badge>
            ))}
            {project.skills?.length > 3 && (
              <Badge variant="outline" className="text-xs bg-gray-50">
                +{project.skills.length - 3} أخرى
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar className="ml-1 h-3 w-3" />
              {new Date(project.createdAt).toLocaleDateString('ar-SA')}
            </div>
            <div className="flex items-center">
              <Eye className="ml-1 h-3 w-3" />
              مشاهدة التفاصيل
            </div>
          </div>
          
          <Button className="w-full" size="sm" asChild>
            <Link href="/auth/register">
              تقديم عرض
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const ProjectSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start gap-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-5 w-16" />
      </div>
    </CardHeader>
    <CardContent className="pb-4">
      <Skeleton className="h-16 w-full mb-4" />
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-18" />
        </div>
      </div>
    </CardContent>
    <CardFooter className="pt-0">
      <Skeleton className="h-8 w-full" />
    </CardFooter>
  </Card>
);

const TrendingProjectsPage = () => {
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['/api/recommendations/trending-projects'],
    queryFn: async () => {
      const response = await fetch('/api/recommendations/trending-projects?limit=20');
      if (!response.ok) {
        throw new Error('فشل في الحصول على المشاريع الرائجة');
      }
      return response.json();
    },
  });

  return (
    <>
      <SEO
        title="المشاريع الرائجة - لينكتك"
        description="اكتشف أحدث المشاريع التقنية الرائجة والمطلوبة من رواد الأعمال. انضم الآن وقدم عروضك للمشاريع الأكثر طلباً في السوق."
        keywords="مشاريع رائجة, مشاريع تقنية, عروض برمجة, مشاريع مطلوبة, تطوير تطبيقات"
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 mb-4">
                <TrendingUp className="ml-2 h-5 w-5 text-blue-600" />
                <span className="text-blue-700 font-medium text-sm">الأكثر طلباً</span>
              </div>
              
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                المشاريع الرائجة
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                اكتشف أحدث المشاريع التقنية الأكثر طلباً في السوق وقدم عروضك للفوز بفرص العمل الذهبية
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold">{projects?.length || 0}</div>
                <div className="text-blue-100">مشروع رائج</div>
              </div>
              <div>
                <div className="text-2xl font-bold">30</div>
                <div className="text-blue-100">دقيقة متوسط الاستجابة</div>
              </div>
              <div>
                <div className="text-2xl font-bold">95%</div>
                <div className="text-blue-100">معدل نجاح المشاريع</div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProjectSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="bg-red-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">حدث خطأ في التحميل</h3>
                  <p className="text-red-600 mb-4">لم نتمكن من تحميل المشاريع الرائجة. يرجى المحاولة مرة أخرى.</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    إعادة المحاولة
                  </Button>
                </div>
              </div>
            </div>
          ) : projects && projects.length > 0 ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {projects.length} مشروع رائج متاح الآن
                </h2>
                <p className="text-gray-600">اختر المشروع المناسب لخبراتك وقدم عرضك</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <TrendingUp className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد مشاريع رائجة حالياً</h3>
                <p className="text-gray-600 mb-6">
                  تحقق مرة أخرى قريباً للعثور على أحدث المشاريع الرائجة
                </p>
                <div className="space-y-3">
                  <Button asChild>
                    <Link href="/projects">تصفح جميع المشاريع</Link>
                  </Button>
                  <div>
                    <Link href="/auth/register" className="text-primary hover:underline">
                      إنشاء حساب جديد
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                هل أنت مستعد لبدء مشروعك التقني؟
              </h2>
              <p className="text-gray-600 mb-6">
                انضم إلى آلاف الشركات والمطورين الذين يستخدمون منصتنا لتحقيق مشاريعهم
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/auth/register">
                    <Users className="ml-2 h-5 w-5" />
                    إنشاء حساب مجاناً
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/how-it-works">كيف تعمل المنصة</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrendingProjectsPage;