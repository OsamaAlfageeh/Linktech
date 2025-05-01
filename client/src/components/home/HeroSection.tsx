import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Users, CheckCircle, TrendingUp } from "lucide-react";

// تعريف نوع الإحصائيات
interface PlatformStats {
  companiesCount: number;
  offersCount: number;
  responseTimeMinutes: number;
  completedProjectsCount: number;
}

type HeroSectionProps = {
  auth: {
    isAuthenticated: boolean;
    isCompany: boolean;
    isEntrepreneur: boolean;
  };
};

const HeroSection = ({ auth }: HeroSectionProps) => {
  const [headerImageUrl, setHeaderImageUrl] = useState<string | null>(null);
  const [sideImageUrl, setSideImageUrl] = useState<string | null>(null);
  
  // استعلام لجلب إعدادات صورة خلفية الهيدر
  const { data: headerImageSetting } = useQuery({
    queryKey: ["/api/site-settings/header_image"],
    queryFn: async () => {
      const response = await fetch("/api/site-settings/header_image");
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
  });
  
  // استعلام لجلب إعدادات صورة الجانب
  const { data: sideImageSetting } = useQuery({
    queryKey: ["/api/site-settings/side_image"],
    queryFn: async () => {
      const response = await fetch("/api/site-settings/side_image");
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
  });
  
  // استعلام لجلب إحصائيات المنصة (عدد الشركات الموثقة ووقت الاستجابة)
  const { data: platformStats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/platform-stats"],
    queryFn: async () => {
      const response = await fetch("/api/platform-stats");
      if (!response.ok) {
        throw new Error("Failed to fetch platform stats");
      }
      return response.json();
    },
  });
  
  // استخراج روابط الصور عند تحميل البيانات
  useEffect(() => {
    if (headerImageSetting?.value) {
      setHeaderImageUrl(headerImageSetting.value);
    }
    
    if (sideImageSetting?.value) {
      setSideImageUrl(sideImageSetting.value);
    }
  }, [headerImageSetting, sideImageSetting]);
  
  const getEntrepreneurLink = () => {
    if (auth.isAuthenticated && auth.isEntrepreneur) {
      return "/dashboard/entrepreneur";
    }
    return auth.isAuthenticated ? "/auth/register" : "/auth/register";
  };
  
  const getCompanyLink = () => {
    if (auth.isAuthenticated && auth.isCompany) {
      return "/dashboard/company";
    }
    return auth.isAuthenticated ? "/auth/register" : "/auth/register";
  };
  
  return (
    <section 
      className="text-white py-16 md:py-24 relative bg-gradient-to-r from-primary to-primary-dark"
      style={headerImageUrl ? {
        backgroundImage: `url(${headerImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
    >
      {/* إضافة طبقة داكنة لتحسين تباين النص */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-xl" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
              ربط رواد الأعمال <span className="text-amber-300">بشركات البرمجة</span> الموثوقة والمعتمدة
            </h1>
            <p className="text-lg md:text-xl mb-4 text-white drop-shadow-md font-medium" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
              منصة رسمية تضمن لك إيجاد الشريك التقني المعتمد لتحويل أفكارك إلى مشاريع ناجحة بأعلى معايير الجودة والاحترافية.
            </p>
            
            {/* عبارة تسويقية وإحصائيات المنصة */}
            <div className="bg-primary-dark/90 backdrop-blur-sm p-5 rounded-lg mb-6 border border-white/30 shadow-lg">
              <p className="text-amber-300 font-semibold mb-3 flex items-center text-lg">
                <Clock className="ml-2 h-6 w-6" />
                احصل على عرض سعر مبدئي خلال 30 دقيقة فقط!
              </p>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-lg flex items-center justify-center">
                  <Users className="ml-3 h-6 w-6 text-blue-200" />
                  <div>
                    <div className="font-bold text-3xl text-white">
                      {statsLoading ? "..." : platformStats?.companiesCount || 0}+
                    </div>
                    <div className="text-sm text-blue-100">شركة برمجية</div>
                  </div>
                </div>
                
                <div className="bg-white/10 p-4 rounded-lg flex items-center justify-center">
                  <TrendingUp className="ml-3 h-6 w-6 text-green-200" />
                  <div>
                    <div className="font-bold text-3xl text-white">
                      {statsLoading ? "..." : platformStats?.offersCount || 0}+
                    </div>
                    <div className="text-sm text-green-100">عرض مقدم</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
              <Link 
                href={getEntrepreneurLink()} 
                className="bg-white text-primary hover:bg-neutral-100 font-medium rounded-lg px-6 py-3 text-center transition-all duration-300"
              >
                أنا رائد أعمال
              </Link>
              <Link 
                href={getCompanyLink()} 
                className="bg-accent hover:bg-accent-dark text-white font-medium rounded-lg px-6 py-3 text-center transition-all duration-300 hover-button-scale hover:shadow-lg relative overflow-hidden group"
              >
                <span className="relative z-10">أنا شركة برمجة</span>
                <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 transform scale-x-0 origin-right transition-transform duration-300 group-hover:scale-x-100"></span>
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <div className="rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              {sideImageUrl ? (
                <img 
                  src={sideImageUrl} 
                  alt="صورة توضيحية" 
                  className="w-full h-auto object-cover"
                />
              ) : (
                <svg viewBox="0 0 600 400" className="w-full h-auto">
                  <rect width="600" height="400" fill="#3B82F6" />
                  <path d="M0 200 L300 100 L600 250 L600 400 L0 400 Z" fill="#2563EB" />
                  <circle cx="450" cy="150" r="80" fill="#F59E0B" fillOpacity="0.3" />
                  <path d="M150,100 C150,100 250,20 350,100 C450,180 450,180 350,250 C250,320 150,250 150,200 Z" fill="#C1DDFF" fillOpacity="0.5" />
                  <path d="M320,220 C320,220 380,280 450,220 C520,160 520,160 450,100 C380,40 320,100 320,170 Z" fill="#C7D9FF" fillOpacity="0.4" />
                  <g transform="translate(250, 170)">
                    <rect x="-100" y="-50" width="200" height="140" rx="10" fill="#FAFEFF" />
                    <rect x="-80" y="-30" width="160" height="15" rx="2" fill="#E5E7EB" />
                    <rect x="-80" y="-5" width="90" height="15" rx="2" fill="#E5E7EB" />
                    <rect x="-80" y="20" width="160" height="40" rx="2" fill="#3B82F6" />
                    <rect x="-80" y="70" width="70" height="10" rx="2" fill="#E5E7EB" />
                  </g>
                  <g transform="translate(120, 200)">
                    <rect x="-50" y="-30" width="100" height="80" rx="5" fill="#F8FAFF" />
                    <line x1="-30" y1="-10" x2="30" y2="-10" stroke="#E5E7EB" strokeWidth="5" />
                    <line x1="-30" y1="5" x2="10" y2="5" stroke="#E5E7EB" strokeWidth="5" />
                    <line x1="-30" y1="20" x2="30" y2="20" stroke="#E5E7EB" strokeWidth="5" />
                    <circle cx="-30" cy="40" r="10" fill="#F59E0B" />
                  </g>
                  <g transform="translate(430, 290)">
                    <rect x="-40" y="-25" width="80" height="60" rx="5" fill="#F1F5FF" />
                    <rect x="-25" y="-15" width="50" height="40" rx="2" fill="#E5E7EB" />
                    <circle cx="0" cy="5" r="12" fill="#3B82F6" />
                  </g>
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
