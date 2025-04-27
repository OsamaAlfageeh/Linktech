import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RecommendedProjects } from "@/components/recommendations";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Globe, 
  MessageSquare, 
  AlertCircle,
  Lock,
  CreditCard,
  CheckCircle2
} from "lucide-react";

type CompanyProfile = {
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
  email?: string;
  username?: string;
};

const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const companyId = parseInt(id);
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [hasPaid, setHasPaid] = useState(false);

  const {
    data: company,
    isLoading,
    error,
  } = useQuery<CompanyProfile>({
    queryKey: [`/api/companies/${companyId}`],
    enabled: !!companyId && !isNaN(companyId),
  });
  
  // Check for invalid company ID
  useEffect(() => {
    if (!id || isNaN(parseInt(id))) {
      navigate("/not-found");
    }
  }, [id, navigate]);

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-amber-500 text-amber-500 h-5 w-5" />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
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
      stars.push(<Star key={`empty-${i}`} className="text-amber-500 h-5 w-5" />);
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
    
    return `bg-gradient-to-r ${colors[id % colors.length]}`;
  };

  return (
    <>
      <Helmet>
        <title>{company ? `${company.name} | تِكلينك` : 'ملف الشركة | تِكلينك'}</title>
        <meta name="description" content={company?.description || 'ملف شركة البرمجة'} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/companies" className="text-primary hover:text-primary-dark inline-flex items-center">
            <ArrowLeft className="ml-1 h-4 w-4 rtl-flip" />
            العودة إلى الشركات
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="relative px-6 md:px-8">
              <div className="absolute -top-16 right-8">
                <Skeleton className="w-32 h-32 rounded-xl" />
              </div>
              <div className="pt-20 pb-8">
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-5 w-1/4 mb-6" />
                <Skeleton className="h-20 w-full mb-6" />
                <div className="flex flex-wrap gap-2 mb-6">
                  <Skeleton className="h-7 w-24 rounded" />
                  <Skeleton className="h-7 w-20 rounded" />
                  <Skeleton className="h-7 w-28 rounded" />
                </div>
                <div className="flex flex-wrap gap-4 mb-6">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-6 w-40" />
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">لا يمكن تحميل بيانات الشركة</h2>
            <p className="text-neutral-600 mb-6">حدث خطأ أثناء محاولة تحميل بيانات الشركة. يرجى المحاولة مرة أخرى لاحقًا.</p>
            <Button onClick={() => window.location.reload()} variant="outline">إعادة المحاولة</Button>
          </div>
        ) : company ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Cover photo */}
            <div className={`w-full h-48 ${company.coverPhoto ? '' : getCoverGradient(company.id)}`}>
              {company.coverPhoto && (
                <img 
                  src={company.coverPhoto} 
                  alt={company.name || ''} 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Company details */}
            <div className="relative px-6 md:px-8">
              {/* Logo */}
              <div className="absolute -top-16 right-8">
                <div className="w-32 h-32 rounded-xl bg-white shadow-md flex items-center justify-center overflow-hidden p-2">
                  {company.logo ? (
                    <img 
                      src={company.logo} 
                      alt={company.name || ''} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center rounded-lg ${getCoverGradient(company.id)} text-white text-4xl font-bold`}>
                      {company.name?.charAt(0) || ''}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-20 pb-8">
                {/* Company name and rating */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold font-heading mb-2">{company.name}</h1>
                  <div className="flex items-center">
                    <div className="flex items-center text-amber-500 ml-2">
                      {renderStars(company.rating)}
                    </div>
                    <span className="text-neutral-600">
                      ({company.rating?.toFixed(1)}) - {company.reviewCount} مراجعة
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <p className="text-neutral-700 whitespace-pre-line">{company.description}</p>
                </div>

                {/* Skills */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold font-heading mb-3">التخصصات</h2>
                  <div className="flex flex-wrap gap-2">
                    {company.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-lg">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Contact details */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-6">
                  {company.location && (
                    <div className="flex items-center text-neutral-700">
                      <MapPin className="ml-1 h-5 w-5 text-neutral-500" />
                      <span>{company.location}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center text-neutral-700">
                      <Globe className="ml-1 h-5 w-5 text-neutral-500" />
                      <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-primary hover:underline">
                        {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                {/* Contact button */}
                <div className="mt-6">
                  <Link href={`/messages?userId=${company.userId}`}>
                    <Button className="w-full md:w-auto">
                      <MessageSquare className="ml-2 h-4 w-4" />
                      تواصل مع الشركة
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">لم يتم العثور على الشركة</h2>
            <p className="text-neutral-600 mb-6">لا يمكن العثور على الشركة المطلوبة. قد يكون تم حذفها أو أن الرابط غير صحيح.</p>
            <Link href="/companies">
              <Button>عرض جميع الشركات</Button>
            </Link>
          </div>
        )}

        {/* Recommended Projects */}
        {company && (
          <div className="mt-10">
            <RecommendedProjects companyId={company.id} limit={3} />
          </div>
        )}
      </div>
    </>
  );
};

export default CompanyDetails;
