import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { 
  Menu, 
  User, 
  LogOut, 
  LayoutDashboard, 
  MessageSquare, 
  ShieldCheck, 
  UserPlus, 
  ChevronDown,
  Search,
  BellRing,
  Code,
  Layers,
  Zap,
  ExternalLink
} from "lucide-react";

type ModernHeaderProps = {
  auth: {
    user: any;
    isAuthenticated: boolean;
    isCompany: boolean;
    isEntrepreneur: boolean;
    logout: () => void;
  };
};

const ModernHeader = ({ auth }: ModernHeaderProps) => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  // تتبع حالة السكرول لتغيير مظهر الهيدر
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    auth.logout();
  };

  const getDashboardLink = () => {
    if (auth.isCompany) return "/dashboard/company";
    if (auth.isEntrepreneur) return "/dashboard/entrepreneur";
    if (auth.user?.role === "admin") return "/dashboard/admin";
    return "/";
  };

  const isActive = (path: string) => location === path;

  return (
    <>
      {/* شريط الإعلانات - يمكن إزالته أو تغييره حسب الحاجة */}
      {showAnnouncement && (
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white py-2 relative">
          <div className="container mx-auto px-4 text-center text-sm">
            <span className="font-medium">🎉 عروض خاصة للشركات الجديدة - خصم 25% على العمولة لأول مشروع </span>
            <Link href="/offers" className="underline font-bold mr-2 hover:text-white/90">
              اعرف المزيد
            </Link>
            <button 
              onClick={() => setShowAnnouncement(false)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* الهيدر الرئيسي */}
      <header 
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled 
            ? "bg-white/90 backdrop-blur-md shadow-md" 
            : "bg-white/60 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* الشعار */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                {/* شعار مع تأثير تدرج لوني */}
                <span className="font-heading font-extrabold text-2xl md:text-3xl">
                  <span className="bg-clip-text text-transparent bg-gradient-to-l from-primary to-blue-700">لينك</span>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-600">تك</span>
                </span>
              </Link>
            </div>

            {/* القائمة - نسخة سطح المكتب */}
            <nav className="hidden md:block ml-4 mr-auto">
              <ul className="flex space-x-1 space-x-reverse">
                <li>
                  <Link 
                    href="/" 
                    className={`px-3 py-2 rounded-md font-medium transition-colors ${
                      isActive("/") 
                        ? "text-primary bg-primary/5" 
                        : "text-neutral-700 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    الرئيسية
                  </Link>
                </li>
                
                {/* قائمة منسدلة للمشاريع */}
                <li className="relative group">
                  <div className="flex items-center px-3 py-2 rounded-md font-medium text-neutral-700 hover:text-primary hover:bg-primary/5 cursor-pointer">
                    <span>المشاريع</span>
                    <ChevronDown className="mr-1 h-4 w-4 opacity-70 group-hover:opacity-100" />
                  </div>
                  <div className="absolute top-full right-0 w-56 py-2 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                    <Link href="/projects" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary">
                      <Layers className="inline-block ml-2 h-4 w-4" />
                      استعراض المشاريع
                    </Link>
                    {auth.isEntrepreneur && (
                      <Link href="/projects/create" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary">
                        <Code className="inline-block ml-2 h-4 w-4" />
                        إضافة مشروع جديد
                      </Link>
                    )}
                    <Link href="/projects/trending" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary">
                      <Zap className="inline-block ml-2 h-4 w-4" />
                      المشاريع الرائجة
                    </Link>
                  </div>
                </li>
                
                <li>
                  <Link 
                    href="/how-it-works" 
                    className={`px-3 py-2 rounded-md font-medium transition-colors ${
                      isActive("/how-it-works") 
                        ? "text-primary bg-primary/5" 
                        : "text-neutral-700 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    كيف يعمل
                  </Link>
                </li>
                
                <li>
                  <Link 
                    href="/premium-clients" 
                    className={`px-3 py-2 rounded-md font-medium transition-colors ${
                      isActive("/premium-clients") 
                        ? "text-primary bg-primary/5" 
                        : "text-neutral-700 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    عملاء التميز
                  </Link>
                </li>
                
                <li>
                  <Link 
                    href="/blog" 
                    className={`px-3 py-2 rounded-md font-medium transition-colors ${
                      isActive("/blog") || location.startsWith("/blog/")
                        ? "text-primary bg-primary/5" 
                        : "text-neutral-700 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    المدونة
                  </Link>
                </li>
                
                <li>
                  <Link 
                    href="/about" 
                    className={`px-3 py-2 rounded-md font-medium transition-colors ${
                      isActive("/about") 
                        ? "text-primary bg-primary/5" 
                        : "text-neutral-700 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    من نحن
                  </Link>
                </li>
                
                <li>
                  <Link 
                    href="/contact" 
                    className={`px-3 py-2 rounded-md font-medium transition-colors ${
                      isActive("/contact") 
                        ? "text-primary bg-primary/5" 
                        : "text-neutral-700 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    تواصل معنا
                  </Link>
                </li>
              </ul>
            </nav>

            {/* أزرار المستخدم */}
            <div className="flex items-center space-x-4 space-x-reverse">
              
              {auth.isAuthenticated && (
                <>
                  {/* إشعارات */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100 relative">
                        <BellRing className="h-5 w-5" />
                        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold">الإشعارات</h3>
                      </div>
                      <div className="py-2 max-h-[300px] overflow-y-auto">
                        <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                          <p className="text-sm font-medium">تم قبول عرضك للمشروع</p>
                          <p className="text-xs text-gray-500 mt-1">تم قبول عرضك لمشروع "تطبيق إدارة المخزون"</p>
                          <p className="text-xs text-gray-400 mt-1">منذ 20 دقيقة</p>
                        </div>
                        <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                          <p className="text-sm font-medium">مشروع جديد مناسب</p>
                          <p className="text-xs text-gray-500 mt-1">هناك مشروع جديد يتناسب مع مهاراتك</p>
                          <p className="text-xs text-gray-400 mt-1">منذ ساعتين</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 border-t border-gray-100 text-center">
                        <Link href="/notifications" className="text-xs text-primary hover:underline">عرض كافة الإشعارات</Link>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* الرسائل - رمز فقط */}
                  <Link href="/messages" className="p-2 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100 relative">
                    <MessageSquare className="h-5 w-5" />
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-green-500"></span>
                  </Link>
                </>
              )}

              {/* حساب المستخدم أو أزرار تسجيل الدخول */}
              {auth.isAuthenticated ? (
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 flex items-center gap-2 font-normal hover:bg-gray-100">
                        <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                          <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                          <AvatarFallback className="bg-primary text-white">{getInitials(auth.user?.name || "")}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{auth.user?.name?.split(' ')[0]}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-neutral-900 truncate">{auth.user?.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{auth.user?.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={getDashboardLink()} className="cursor-pointer flex w-full">
                          <LayoutDashboard className="ml-2 h-4 w-4" />
                          <span>لوحة التحكم</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/messages" className="cursor-pointer flex w-full">
                          <MessageSquare className="ml-2 h-4 w-4" />
                          <span>الرسائل</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                        <LogOut className="ml-2 h-4 w-4" />
                        <span>تسجيل الخروج</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-4 space-x-reverse">
                  <Link href="/auth/login" className="font-medium text-gray-700 hover:text-primary transition-colors">
                    تسجيل دخول
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="bg-gradient-to-r from-primary to-blue-700 hover:opacity-90 text-white font-medium rounded-full px-5 py-2 transition-all shadow-sm hover:shadow-md"
                  >
                    إنشاء حساب
                  </Link>
                </div>
              )}

              {/* زر القائمة المتنقلة */}
              <div className="md:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">فتح القائمة</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="sm:max-w-md max-h-screen overflow-y-auto">
                    <div className="mt-6 mb-6">
                      <span className="font-heading font-bold text-2xl">
                        <span className="bg-clip-text text-transparent bg-gradient-to-l from-primary to-blue-700">لينك</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-600">تك</span>
                      </span>
                    </div>

                    <div className="py-4">
                      <nav className="flex flex-col space-y-4">
                        <Link 
                          href="/" 
                          onClick={() => setMobileMenuOpen(false)} 
                          className="text-lg font-medium flex items-center"
                        >
                          <span className="inline-block w-6 ml-2 text-primary">•</span>
                          الرئيسية
                        </Link>
                        
                        <Link 
                          href="/projects" 
                          onClick={() => setMobileMenuOpen(false)} 
                          className="text-lg font-medium flex items-center"
                        >
                          <span className="inline-block w-6 ml-2 text-primary">•</span>
                          المشاريع
                        </Link>
                        
                        <Link 
                          href="/how-it-works" 
                          onClick={() => setMobileMenuOpen(false)} 
                          className="text-lg font-medium flex items-center"
                        >
                          <span className="inline-block w-6 ml-2 text-primary">•</span>
                          كيف يعمل
                        </Link>
                        
                        <Link 
                          href="/premium-clients" 
                          onClick={() => setMobileMenuOpen(false)} 
                          className="text-lg font-medium flex items-center"
                        >
                          <span className="inline-block w-6 ml-2 text-primary">•</span>
                          عملاء التميز
                        </Link>
                        
                        <Link 
                          href="/blog" 
                          onClick={() => setMobileMenuOpen(false)} 
                          className="text-lg font-medium flex items-center"
                        >
                          <span className="inline-block w-6 ml-2 text-primary">•</span>
                          المدونة
                        </Link>
                        
                        <Link 
                          href="/about" 
                          onClick={() => setMobileMenuOpen(false)} 
                          className="text-lg font-medium flex items-center"
                        >
                          <span className="inline-block w-6 ml-2 text-primary">•</span>
                          من نحن
                        </Link>
                        
                        <Link 
                          href="/contact" 
                          onClick={() => setMobileMenuOpen(false)} 
                          className="text-lg font-medium flex items-center"
                        >
                          <span className="inline-block w-6 ml-2 text-primary">•</span>
                          تواصل معنا
                        </Link>
                      </nav>

                      <div className="mt-8 pt-6 border-t border-gray-200">
                        {auth.isAuthenticated ? (
                          <div className="space-y-4">
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                <AvatarFallback className="bg-primary text-white">{getInitials(auth.user?.name || "")}</AvatarFallback>
                              </Avatar>
                              <div className="mr-3">
                                <p className="font-medium">{auth.user?.name}</p>
                                <p className="text-xs text-gray-500 mt-1">{auth.user?.email}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <Link 
                                href={getDashboardLink()} 
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center p-3 rounded-md hover:bg-gray-50 text-lg"
                              >
                                <LayoutDashboard className="ml-3 h-5 w-5 text-primary" />
                                <span>لوحة التحكم</span>
                              </Link>
                              
                              <Link 
                                href="/messages" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center p-3 rounded-md hover:bg-gray-50 text-lg"
                              >
                                <MessageSquare className="ml-3 h-5 w-5 text-primary" />
                                <span>الرسائل</span>
                              </Link>
                              
                              <Link 
                                href="/notifications" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center p-3 rounded-md hover:bg-gray-50 text-lg"
                              >
                                <BellRing className="ml-3 h-5 w-5 text-primary" />
                                <span>الإشعارات</span>
                              </Link>
                            </div>
                            
                            <Button 
                              variant="destructive" 
                              className="w-full mt-4 flex items-center justify-center py-6" 
                              onClick={() => {
                                handleLogout();
                                setMobileMenuOpen(false);
                              }}
                            >
                              <LogOut className="ml-2 h-5 w-5" />
                              <span>تسجيل الخروج</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4 pt-2">
                            <Link 
                              href="/auth/login"
                              onClick={() => setMobileMenuOpen(false)}
                              className="block w-full text-center px-4 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
                            >
                              تسجيل دخول
                            </Link>
                            <Link 
                              href="/auth/register"
                              onClick={() => setMobileMenuOpen(false)}
                              className="block w-full text-center bg-gradient-to-r from-primary to-blue-700 text-white px-4 py-3 rounded-md font-medium hover:opacity-90"
                            >
                              إنشاء حساب
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default ModernHeader;