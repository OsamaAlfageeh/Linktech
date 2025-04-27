import { Link } from "wouter";
import { Star, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { truncateText } from "@/lib/utils";

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
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <div className={`h-32 ${company.coverPhoto ? '' : getCoverGradient(company.id)}`}>
          {company.coverPhoto && (
            <img 
              src={company.coverPhoto} 
              alt={company.name || ''} 
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="absolute -bottom-12 right-6">
          <div className="w-24 h-24 rounded-lg bg-white shadow-md flex items-center justify-center overflow-hidden p-1">
            {company.logo ? (
              <img 
                src={company.logo} 
                alt={company.name || ''} 
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center rounded ${getCoverGradient(company.id)} text-white text-2xl font-bold`}>
                {company.name?.charAt(0) || ''}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-6 pt-16">
        <h3 className="font-heading font-semibold text-xl mb-2">{company.name}</h3>
        <div className="flex items-center text-sm text-amber-500 mb-3">
          {renderStars(company.rating)}
          <span className="text-neutral-600 mr-2">
            ({company.rating || 0}) - {company.reviewCount || 0} مراجعة
          </span>
        </div>
        <p className="text-neutral-600 mb-4">{truncateText(company.description, 120)}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(company.skills || []).slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="outline" className="bg-neutral-100 text-neutral-700 text-xs font-medium px-2.5 py-1 rounded">
              {skill}
            </Badge>
          ))}
          {(company.skills || []).length > 3 && (
            <Badge variant="outline" className="bg-neutral-100 text-neutral-700 text-xs font-medium px-2.5 py-1 rounded">
              +{(company.skills || []).length - 3}
            </Badge>
          )}
        </div>
      </div>
      <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex justify-between items-center">
        <Link href={`/companies/${company.id}`} className="text-primary hover:text-primary-dark font-medium">
          عرض الملف
        </Link>
        <Link href={`/messages?userId=${company.userId}`} className="text-neutral-600 hover:text-primary">
          <MessageSquare className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};

export default CompanyCard;
