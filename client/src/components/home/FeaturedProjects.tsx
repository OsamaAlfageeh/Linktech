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

const SimplifiedProjectCard = ({ project }: { project: Project }) => {
  return (
    <div className="card-modern group relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-heading font-bold text-lg text-gray-900 group-hover:text-primary transition-colors duration-300 arabic-spacing">
            {project.title}
          </h3>
          {project.highlightStatus && (
            <span className={`badge-modern animate-pulse ${
              project.highlightStatus === "عالي الطلب" 
                ? "bg-accent/10 text-accent border border-accent/20" 
                : "bg-primary/10 text-primary border border-primary/20"
            }`}>
              {project.highlightStatus}
            </span>
          )}
        </div>
        
        {/* Project description snippet */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {project.description}
        </p>
        
        {/* Skills tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(project.skills || []).slice(0, 3).map((skill, index) => (
            <span 
              key={index} 
              className="badge-modern bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {skill}
            </span>
          ))}
          {(project.skills || []).length > 3 && (
            <span className="badge-modern bg-gray-100 text-gray-600">
              +{(project.skills || []).length - 3}
            </span>
          )}
        </div>
        
        {/* CTA Button */}
        <div className="text-center">
          <Link 
            href="/auth/register" 
            className="btn-primary w-full group-hover:scale-105 transition-transform duration-200"
          >
            اطلب مشروع مماثل
          </Link>
        </div>
      </div>
    </div>
  );
};

const FeaturedProjects = () => {
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Show only the latest 3 projects
  const latestProjects = projects?.slice(0, 3);

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="container-modern">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 animate-bounce-gentle">
            <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
            مشاريع متاحة الآن
          </div>
          
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-gradient">
            مشاريع مطلوبة
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed arabic-spacing">
            فرص مشاريع تقنية مميزة يمكنك الاستفادة منها لبناء مشروعك التالي
          </p>
          
          <div className="mt-8">
            <Link 
              href="/auth/register" 
              className="btn-accent btn-lg group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                إنشاء حساب لرؤية جميع المشاريع
                <ArrowRight className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <>
              <div className="animate-slide-in-left"><ProjectSkeleton /></div>
              <div className="animate-slide-in-left" style={{ animationDelay: '0.1s' }}><ProjectSkeleton /></div>
              <div className="animate-slide-in-left" style={{ animationDelay: '0.2s' }}><ProjectSkeleton /></div>
            </>
          ) : error ? (
            <div className="col-span-full text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">حدث خطأ في التحميل</h3>
              <p className="text-gray-600">لم نتمكن من تحميل المشاريع، يرجى المحاولة مرة أخرى</p>
            </div>
          ) : latestProjects && latestProjects.length > 0 ? (
            latestProjects.map((project, index) => (
              <div 
                key={project.id} 
                className="animate-slide-in-left"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <SimplifiedProjectCard project={project} />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد مشاريع</h3>
              <p className="text-gray-600">لا توجد مشاريع متاحة حالياً، تحقق مرة أخرى لاحقاً</p>
            </div>
          )}
        </div>
        
        {/* Bottom CTA */}
        {latestProjects && latestProjects.length > 0 && (
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-4 space-x-reverse">
              <Link 
                href="/projects" 
                className="btn-secondary"
              >
                استعراض جميع المشاريع
              </Link>
              <Link 
                href="/auth/register" 
                className="btn-primary"
              >
                انضم كشركة
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProjects;
