import { useState } from "react";
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
import { Menu, User, LogOut, LayoutDashboard, MessageSquare, ShieldCheck, UserPlus, Bell } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

type HeaderProps = {
  auth: {
    user: any;
    isAuthenticated: boolean;
    isCompany: boolean;
    isEntrepreneur: boolean;
    logout: () => void;
  };
};

const Header = ({ auth }: HeaderProps) => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-primary font-heading font-bold text-2xl">لينك<span className="text-accent">تك</span></span>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8 space-x-reverse">
              <li>
                {auth.isAuthenticated ? (
                  <Link 
                    href={getDashboardLink()} 
                    className={`px-3 py-2 font-medium ${isActive(getDashboardLink()) ? "text-primary" : "text-neutral-600 hover:text-primary"}`}
                  >
                    لوحة التحكم
                  </Link>
                ) : (
                  <Link 
                    href="/" 
                    className={`px-3 py-2 font-medium ${isActive("/") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}
                  >
                    الرئيسية
                  </Link>
                )}
              </li>
              {auth.isCompany && (
                <li>
                  <Link 
                    href="/projects" 
                    className={`px-3 py-2 font-medium ${isActive("/projects") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}
                  >
                    المشاريع
                  </Link>
                </li>
              )}
              {auth.isCompany && (
                <li>
                  <Link 
                    href="/for-companies" 
                    className={`px-3 py-2 font-medium ${isActive("/for-companies") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}
                  >
                    للشركات
                  </Link>
                </li>
              )}
              {auth.isEntrepreneur && (
                <li>
                  <Link 
                    href="/ai-assistant" 
                    className={`px-3 py-2 font-medium ${isActive("/ai-assistant") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}
                  >
                    المساعد الذكي
                  </Link>
                </li>
              )}
              <li>
                <Link 
                  href="/how-it-works" 
                  className={`px-3 py-2 font-medium ${isActive("/how-it-works") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}
                >
                  كيف يعمل
                </Link>
              </li>
              <li>
                <Link 
                  href="/blog" 
                  className={`px-3 py-2 font-medium ${isActive("/blog") || location.startsWith("/blog/") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}
                >
                  المدونة
                </Link>
              </li>
              <li>
                <Link 
                  href="/premium-clients" 
                  className={`px-3 py-2 font-medium ${isActive("/premium-clients") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}
                >
                  عملاء التميز
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className={`px-3 py-2 font-medium ${isActive("/about") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}
                >
                  من نحن
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className={`px-3 py-2 font-medium ${isActive("/contact") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}
                >
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </nav>

          {/* User Actions */}
          {auth.isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-4 space-x-reverse">
              {/* Notification Bell */}
              <NotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                      <AvatarFallback>{getInitials(auth.user?.name || "")}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-4 py-3">
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
                  <DropdownMenuItem asChild>
                    <Link href="/notifications" className="cursor-pointer flex w-full">
                      <Bell className="ml-2 h-4 w-4" />
                      <span>الإشعارات</span>
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
              <Link href="/auth/login" className="text-neutral-600 hover:text-primary font-medium">
                تسجيل دخول
              </Link>
              <Link href="/auth/register" className="bg-primary hover:bg-primary-dark text-white font-medium rounded-lg px-4 py-2 transition-colors">
                إنشاء حساب
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
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
                  <span className="text-primary font-heading font-bold text-2xl">لينك<span className="text-accent">تك</span></span>
                </div>

                <div className="py-4">
                  <nav className="flex flex-col space-y-4">
                    {auth.isAuthenticated ? (
                      <Link 
                        href={getDashboardLink()} 
                        onClick={() => setMobileMenuOpen(false)} 
                        className="text-lg font-medium"
                      >
                        لوحة التحكم
                      </Link>
                    ) : (
                      <Link 
                        href="/" 
                        onClick={() => setMobileMenuOpen(false)} 
                        className="text-lg font-medium"
                      >
                        الرئيسية
                      </Link>
                    )}
                    
                    {auth.isCompany && (
                      <Link href="/projects" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                        المشاريع
                      </Link>
                    )}

                    {auth.isCompany && (
                      <Link href="/for-companies" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                        للشركات
                      </Link>
                    )}

                    {auth.isEntrepreneur && (
                      <Link href="/ai-assistant" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                        المساعد الذكي
                      </Link>
                    )}
                    
                    <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                      كيف يعمل
                    </Link>
                    
                    <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                      المدونة
                    </Link>
                    
                    <Link href="/premium-clients" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                      عملاء التميز
                    </Link>
                    
                    <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                      من نحن
                    </Link>
                    
                    <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                      تواصل معنا
                    </Link>
                  </nav>

                  <div className="mt-8 pt-4 border-t border-gray-200">
                    {auth.isAuthenticated ? (
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                            <AvatarFallback>{getInitials(auth.user?.name || "")}</AvatarFallback>
                          </Avatar>
                          <div className="mr-3">
                            <p className="text-sm font-medium">{auth.user?.name}</p>
                            <p className="text-xs text-gray-500">{auth.user?.email}</p>
                          </div>
                        </div>
                        <Link 
                          href={getDashboardLink()} 
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center text-lg font-medium"
                        >
                          <LayoutDashboard className="ml-2 h-5 w-5" />
                          <span>لوحة التحكم</span>
                        </Link>
                        <Link 
                          href="/messages" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center text-lg font-medium"
                        >
                          <MessageSquare className="ml-2 h-5 w-5" />
                          <span>الرسائل</span>
                        </Link>
                        <Link 
                          href="/notifications" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center text-lg font-medium"
                        >
                          <Bell className="ml-2 h-5 w-5" />
                          <span>الإشعارات</span>
                        </Link>
                        <Button 
                          variant="destructive" 
                          className="w-full mt-4 flex items-center justify-center" 
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
                      <div className="space-y-4">
                        <Link 
                          href="/auth/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
                        >
                          تسجيل دخول
                        </Link>
                        <Link 
                          href="/auth/register"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full text-center bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium"
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
    </header>
  );
};

export default Header;
