import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type HeroSectionProps = {
  auth: {
    isAuthenticated: boolean;
    isCompany: boolean;
    isEntrepreneur: boolean;
  };
};

const HeroSection = ({ auth }: HeroSectionProps) => {
  const [headerImageUrl, setHeaderImageUrl] = useState<string | null>(null);
  
  // استعلام لجلب إعدادات الموقع
  const { data: siteSettings } = useQuery({
    queryKey: ["/api/site-settings/header_image"],
    queryFn: async () => {
      const response = await fetch("/api/site-settings/header_image");
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
  });
  
  // استخراج رابط صورة الهيدر عند تحميل البيانات
  useEffect(() => {
    if (siteSettings?.value) {
      setHeaderImageUrl(siteSettings.value);
    }
  }, [siteSettings]);
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
      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4 text-shadow-lg">
              ربط رواد الأعمال بشركات البرمجة المحترفة
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white text-shadow">
              نسهل عليك إيجاد الشريك المناسب لتحويل أفكارك التقنية إلى واقع. ابدأ رحلتك التقنية اليوم!
            </p>
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
