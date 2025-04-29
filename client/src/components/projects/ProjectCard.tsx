import { Link } from "wouter";
import { CalendarIcon, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { truncateText } from "@/lib/utils";

type ProjectProps = {
  project: {
    id: number;
    title: string;
    description: string;
    budget: string;
    duration: string;
    skills: string[];
    status: string;
    highlightStatus?: string;
  };
};

const ProjectCard = ({ project }: ProjectProps) => {
  const getHighlightBadgeColor = (status?: string) => {
    if (!status) return null;
    
    if (status === "عالي الطلب") {
      return "bg-accent-light text-accent-dark";
    } else if (status === "جديد") {
      return "bg-primary-light text-primary-dark";
    } else {
      return "bg-neutral-100 text-neutral-700";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover-card-lift fade-in transform transition-all duration-300 hover:shadow-md">
      <div className="p-3 sm:p-4 md:p-6">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <h3 className="font-heading font-semibold text-base sm:text-lg md:text-xl transition-all duration-300 hover:text-primary hover:translate-x-1 leading-tight">{project.title}</h3>
          {project.highlightStatus && (
            <span className={`text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full ${getHighlightBadgeColor(project.highlightStatus)} transition-all duration-300 hover:shadow-md hover:scale-105 pulse-effect whitespace-nowrap mr-1`}>
              {project.highlightStatus}
            </span>
          )}
        </div>
        <p className="text-neutral-600 text-xs sm:text-sm md:text-base mb-3 md:mb-4 transition-all duration-300 hover:text-neutral-800">{truncateText(project.description, window.innerWidth < 640 ? 80 : 120)}</p>
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 md:mb-4">
          {(project.skills || []).slice(0, window.innerWidth < 640 ? 3 : undefined).map((skill, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="bg-neutral-100 text-neutral-700 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded badge-pulse transition-all duration-300 hover:bg-neutral-200 hover:shadow-sm"
            >
              {skill}
            </Badge>
          ))}
          {window.innerWidth < 640 && (project.skills || []).length > 3 && (
            <Badge 
              variant="outline" 
              className="bg-neutral-100 text-neutral-600 text-[10px] px-1.5 py-0.5 rounded"
            >
              +{(project.skills || []).length - 3}
            </Badge>
          )}
        </div>
        <div className="flex justify-between items-center text-xs sm:text-sm border-t border-neutral-200 pt-3 md:pt-4">
          <div className="text-neutral-600 flex items-center group transition-all duration-300 hover:translate-y-[-2px]">
            <Banknote className="text-[hsl(160,84%,39%)] h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-1.5 transition-transform duration-300 group-hover:scale-125" />
            <span className="transition-colors duration-300 group-hover:text-[hsl(160,84%,39%)] font-medium">{project.budget}</span>
          </div>
          <div className="text-neutral-600 flex items-center group transition-all duration-300 hover:translate-y-[-2px]">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-1.5 transition-transform duration-300 group-hover:scale-125" />
            <span className="transition-colors duration-300 group-hover:text-primary font-medium">{project.duration}</span>
          </div>
        </div>
      </div>
      <div className="bg-neutral-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3 border-t border-neutral-200">
        <Link 
          href={`/projects/${project.id}`} 
          className="text-primary hover:text-primary-dark text-sm md:text-base font-medium inline-block relative overflow-hidden before:absolute before:bottom-0 before:right-0 before:h-[2px] before:w-full before:origin-bottom-right before:scale-x-0 before:bg-primary before:transition-transform before:duration-300 hover:before:origin-bottom-left hover:before:scale-x-100 transition-all duration-300 hover:translate-x-1"
        >
          عرض التفاصيل
        </Link>
      </div>
    </div>
  );
};

export default ProjectCard;
