import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Users, CheckCircle, TrendingUp, Star, Zap, Shield, Award } from "lucide-react";
import { motion } from "framer-motion";

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
      className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden"
      style={headerImageUrl ? {
        backgroundImage: `url(${headerImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"></div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 right-20 text-blue-300/30"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Zap size={40} />
        </motion.div>
        <motion.div 
          className="absolute bottom-32 left-16 text-purple-300/30"
          animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          <Shield size={50} />
        </motion.div>
        <motion.div 
          className="absolute top-1/3 left-20 text-amber-300/30"
          animate={{ y: [0, -25, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
        >
          <Award size={35} />
        </motion.div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content Section */}
          <motion.div 
            className="order-2 lg:order-1 text-center lg:text-right"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Star className="ml-2 h-4 w-4 text-amber-400" />
              <span className="text-amber-300 font-medium text-sm">المنصة الأولى في المملكة</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span className="text-white drop-shadow-2xl">ربط رواد الأعمال</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                بشركات البرمجة
              </span>
              <br />
              <span className="text-white drop-shadow-2xl">الموثوقة</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed max-w-2xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              منصة رسمية معتمدة تضمن لك إيجاد الشريك التقني المثالي لتحويل أفكارك إلى مشاريع ناجحة
              <span className="text-amber-300 font-semibold"> بأعلى معايير الجودة والاحترافية</span>
            </motion.p>

            {/* Quick Promise */}
            <motion.div 
              className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 backdrop-blur-xl p-6 rounded-2xl mb-8 border border-emerald-400/30 shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  className="flex items-center text-emerald-300 font-bold text-xl"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="ml-3 h-7 w-7" />
                  استجابة فورية خلال 30 دقيقة!
                </motion.div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6">
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm p-6 rounded-xl text-center border border-white/20"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-8 w-8 text-blue-300" />
                  </div>
                  <div className="font-bold text-4xl text-white mb-1">
                    {statsLoading ? "..." : platformStats?.companiesCount || 0}+
                  </div>
                  <div className="text-blue-200 font-medium">شركة متخصصة</div>
                </motion.div>
                
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm p-6 rounded-xl text-center border border-white/20"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-8 w-8 text-green-300" />
                  </div>
                  <div className="font-bold text-4xl text-white mb-1">
                    {statsLoading ? "..." : platformStats?.offersCount || 0}+
                  </div>
                  <div className="text-green-200 font-medium">عرض مقدم</div>
                </motion.div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 sm:space-x-reverse justify-center lg:justify-start"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href={getEntrepreneurLink()} 
                  className="group relative bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-2xl px-8 py-4 text-lg text-center transition-all duration-300 shadow-2xl hover:shadow-amber-500/25 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <Users className="ml-2 h-5 w-5" />
                    أنا رائد أعمال
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href={getCompanyLink()} 
                  className="group relative bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-bold rounded-2xl px-8 py-4 text-lg text-center transition-all duration-300 border border-white/30 hover:border-white/50 shadow-2xl overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <Shield className="ml-2 h-5 w-5" />
                    أنا شركة برمجة
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Visual Section */}
          <motion.div 
            className="order-1 lg:order-2 flex justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative">
              {sideImageUrl ? (
                <motion.div
                  className="rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full"
                  whileHover={{ scale: 1.02, rotate: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <img 
                    src={sideImageUrl} 
                    alt="صورة توضيحية" 
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              ) : (
                <motion.div
                  className="relative max-w-lg w-full"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Modern Illustrated Hero Graphic */}
                  <svg viewBox="0 0 600 500" className="w-full h-auto drop-shadow-2xl">
                    {/* Background */}
                    <defs>
                      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e40af" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                      <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#f8fafc" />
                      </linearGradient>
                    </defs>
                    
                    <rect width="600" height="500" rx="30" fill="url(#bgGradient)" />
                    
                    {/* Floating Elements */}
                    <circle cx="500" cy="100" r="60" fill="#fbbf24" fillOpacity="0.2" />
                    <circle cx="100" cy="400" r="40" fill="#10b981" fillOpacity="0.3" />
                    <circle cx="550" cy="350" r="30" fill="#f59e0b" fillOpacity="0.4" />
                    
                    {/* Main Dashboard Card */}
                    <g transform="translate(150, 120)">
                      <rect width="300" height="200" rx="15" fill="url(#cardGradient)" stroke="#e2e8f0" strokeWidth="2" />
                      {/* Header */}
                      <rect x="20" y="20" width="260" height="40" rx="8" fill="#3b82f6" />
                      <circle cx="40" cy="40" r="8" fill="#ffffff" />
                      <rect x="60" y="35" width="120" height="10" rx="5" fill="#ffffff" fillOpacity="0.9" />
                      {/* Content */}
                      <rect x="20" y="80" width="200" height="12" rx="6" fill="#e2e8f0" />
                      <rect x="20" y="100" width="150" height="12" rx="6" fill="#e2e8f0" />
                      <rect x="20" y="120" width="180" height="12" rx="6" fill="#e2e8f0" />
                      {/* Button */}
                      <rect x="20" y="150" width="100" height="30" rx="15" fill="#f59e0b" />
                      <rect x="140" y="155" width="60" height="20" rx="10" fill="#10b981" />
                    </g>
                    
                    {/* Side Card 1 */}
                    <g transform="translate(50, 250)">
                      <rect width="150" height="120" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                      <circle cx="30" cy="30" r="15" fill="#3b82f6" />
                      <rect x="55" y="20" width="80" height="8" rx="4" fill="#e2e8f0" />
                      <rect x="55" y="35" width="60" height="8" rx="4" fill="#e2e8f0" />
                      <rect x="20" y="60" width="110" height="40" rx="8" fill="#f1f5f9" />
                    </g>
                    
                    {/* Side Card 2 */}
                    <g transform="translate(400, 280)">
                      <rect width="150" height="120" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                      <rect x="20" y="20" width="110" height="30" rx="6" fill="#10b981" />
                      <circle cx="30" cy="70" r="12" fill="#f59e0b" />
                      <rect x="50" y="65" width="80" height="10" rx="5" fill="#e2e8f0" />
                      <rect x="20" y="90" width="110" height="15" rx="7" fill="#f1f5f9" />
                    </g>
                    
                    {/* Connection Lines */}
                    <path d="M200 220 Q300 180 400 220" stroke="#6366f1" strokeWidth="3" fill="none" strokeDasharray="10,5" opacity="0.6" />
                    <path d="M300 320 Q350 280 400 320" stroke="#f59e0b" strokeWidth="3" fill="none" strokeDasharray="8,4" opacity="0.6" />
                  </svg>
                  
                  {/* Floating Icons */}
                  <motion.div 
                    className="absolute top-10 right-10 text-amber-400"
                    animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Star size={24} />
                  </motion.div>
                  
                  <motion.div 
                    className="absolute bottom-20 left-10 text-emerald-400"
                    animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                  >
                    <CheckCircle size={28} />
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
