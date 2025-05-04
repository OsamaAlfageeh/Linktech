import { Link } from "wouter";
import { Star, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { truncateText } from "@/lib/utils";
import { LazyImage } from "@/components/ui/lazy-image";

type CompanyProps = {
  company: {
    id: number;
    userId: number;
    description: string;
    logo?: string;
    coverPhoto?: string;
    website?: string;
    location?: string;
    skills: string[];
    rating?: number;
    reviewCount?: number;
    name?: string;
    username?: string;
  };
};

const CompanyCard = ({ company }: CompanyProps) => {
  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-amber-500 text-amber-500 h-4 w-4" />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
          <defs>
            <linearGradient id="halfFill">
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="url(#halfFill)" stroke="currentColor" />
        </svg>
      );
    }
    
    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-amber-500 h-4 w-4" />);
    }
    
    return stars;
  };

  const getCoverGradient = (id: number) => {
    const colors = [
      "from-blue-400 to-blue-600",
      "from-purple-400 to-purple-600",
      "from-green-400 to-green-600",
      "from-red-400 to-red-600",
      "from-indigo-400 to-indigo-600"
    ];
    
    return `bg-gradient-to-r ${colors[(id || 1) % colors.length]}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover-card-lift transform transition-all duration-300 hover:shadow-md">
      <div className="relative">
        <div className={`h-24 sm:h-28 md:h-32 ${company.coverPhoto ? '' : getCoverGradient(company.id)} overflow-hidden`}>
          {company.coverPhoto ? (
            <LazyImage 
              src={company.coverPhoto} 
              alt={company.name || 'صورة غلاف الشركة'} 
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
              loadingClassname="animate-pulse bg-neutral-200 w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent z-10"></div>
          )}
        </div>
        <div className="absolute -bottom-12 sm:-bottom-14 right-4 sm:right-6 z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-white shadow-md flex items-center justify-center overflow-hidden p-1 transition-all duration-300 hover:shadow-lg hover:scale-105">
            {company.logo ? (
              <LazyImage 
                src={company.logo} 
                alt={company.name || 'شعار الشركة'} 
                className="w-full h-full object-cover rounded hover:scale-105 transition-transform duration-300"
                loadingClassname="animate-pulse bg-neutral-200 w-full h-full rounded"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center rounded ${getCoverGradient(company.id)} text-white text-xl sm:text-2xl font-bold transition-all duration-300 hover:opacity-90`}>
                {company.name?.charAt(0) || ''}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-3 sm:p-4 md:p-6 pt-14 sm:pt-20">
        <h3 className="font-heading font-semibold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 transition-colors duration-300 hover:text-primary bg-gradient-to-r from-primary to-primary bg-[length:0%_2px] bg-no-repeat bg-bottom group-hover:bg-[length:100%_2px] line-clamp-1 relative">{company.name}</h3>
        <div className="flex items-center text-xs sm:text-sm text-amber-500 mb-2 sm:mb-3 group">
          <div className="flex transition-transform duration-300 group-hover:scale-110">
            {renderStars(company.rating)}
          </div>
          <span className="text-neutral-600 mr-2 text-xs">
            ({company.rating || 0}) - {company.reviewCount || 0} مراجعة
          </span>
        </div>
        <p className="text-neutral-600 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 line-clamp-3">{truncateText(company.description, window.innerWidth < 640 ? 80 : 120)}</p>
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
          {(company.skills || []).slice(0, window.innerWidth < 640 ? 2 : 3).map((skill, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="bg-neutral-100 text-neutral-700 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded badge-pulse transition-all duration-300 hover:bg-neutral-200"
            >
              {skill}
            </Badge>
          ))}
          {(company.skills || []).length > (window.innerWidth < 640 ? 2 : 3) && (
            <Badge 
              variant="outline" 
              className="bg-neutral-100 text-neutral-700 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded badge-pulse transition-all duration-300 hover:bg-neutral-200"
            >
              +{(company.skills || []).length - (window.innerWidth < 640 ? 2 : 3)}
            </Badge>
          )}
        </div>
      </div>
      <div className="bg-neutral-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3 border-t border-neutral-200 flex justify-between items-center">
        <Link 
          href={`/companies/${company.id}`} 
          className="text-primary hover:text-primary-dark text-sm sm:text-base font-medium link-underline relative overflow-hidden after:absolute after:bottom-0 after:right-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary-dark after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100"
        >
          عرض الملف
        </Link>
        <Link 
          href={`/messages?userId=${company.userId}`} 
          className="text-neutral-600 hover:text-primary p-1.5 sm:p-2 rounded-full transition-all duration-200 hover:bg-neutral-200 hover:shadow-sm"
        >
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 rtl-flip transition-transform duration-200 hover:scale-110" />
        </Link>
      </div>
    </div>
  );
};

export default CompanyCard;
