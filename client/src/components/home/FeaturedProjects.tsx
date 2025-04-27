import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ProjectCard from "@/components/projects/ProjectCard";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

const FeaturedProjects = () => {
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Show only the latest 3 projects
  const latestProjects = projects?.slice(0, 3);

  return (
    <section className="py-16 bg-neutral-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h2 className="font-heading text-3xl font-bold text-neutral-800">أحدث المشاريع</h2>
            <p className="mt-2 text-lg text-neutral-600">استكشف أحدث فرص المشاريع التقنية المتاحة</p>
          </div>
          <Link href="/projects" className="mt-4 md:mt-0 text-primary font-medium hover:text-primary-dark flex items-center">
            عرض جميع المشاريع
            <ArrowRight className="mr-2 h-4 w-4 rtl-flip" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <ProjectSkeleton />
              <ProjectSkeleton />
              <ProjectSkeleton />
            </>
          ) : error ? (
            <div className="col-span-3 text-center py-8">
              <p className="text-neutral-600">حدث خطأ أثناء تحميل المشاريع. حاول مرة أخرى لاحقاً.</p>
            </div>
          ) : latestProjects && latestProjects.length > 0 ? (
            latestProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-neutral-600">لا توجد مشاريع متاحة حالياً.</p>
              <Link href="/projects/create" className="mt-4 inline-block bg-primary hover:bg-primary-dark text-white font-medium rounded-lg px-6 py-2 transition-colors">
                أنشئ مشروعاً جديداً
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
