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
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-heading font-semibold text-xl">{project.title}</h3>
          {project.highlightStatus && (
            <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${getHighlightBadgeColor(project.highlightStatus)}`}>
              {project.highlightStatus}
            </span>
          )}
        </div>
        <p className="text-neutral-600 mb-4">{truncateText(project.description, 120)}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.skills.map((skill, index) => (
            <Badge key={index} variant="outline" className="bg-neutral-100 text-neutral-700 text-xs font-medium px-2.5 py-1 rounded">
              {skill}
            </Badge>
          ))}
        </div>
        <div className="flex justify-between items-center text-sm border-t border-neutral-200 pt-4">
          <div className="text-neutral-600 flex items-center">
            <Banknote className="text-[hsl(160,84%,39%)] h-4 w-4 ml-1" />
            <span>{project.budget}</span>
          </div>
          <div className="text-neutral-600 flex items-center">
            <CalendarIcon className="h-4 w-4 ml-1" />
            <span>{project.duration}</span>
          </div>
        </div>
      </div>
      <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200">
        <Link href={`/projects/${project.id}`} className="text-primary hover:text-primary-dark font-medium">
          عرض التفاصيل
        </Link>
      </div>
    </div>
  );
};

export default ProjectCard;
