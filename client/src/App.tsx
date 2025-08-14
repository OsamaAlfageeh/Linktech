import React, { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { apiRequest } from "./lib/queryClient";

// Layout
import Header from "@/components/layout/Header";
import ModernHeader from "@/components/layout/ModernHeader";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";

// Pages
import Home from "@/pages/home";
import Projects from "@/pages/projects";
import ProjectDetails from "@/pages/projects/[id]";
import TrendingProjects from "@/pages/projects/trending";
import CompanyDetails from "@/pages/companies/[id]";
import ForCompanies from "@/pages/for-companies";
import Register from "@/pages/auth/register";
import Login from "@/pages/auth/login";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";
import EntrepreneurDashboard from "@/pages/dashboard/entrepreneur";
import CompanyDashboard from "@/pages/dashboard/company";
import AdminDashboard from "@/pages/dashboard/admin";
// Removed AdminLogin import as it's now integrated with the main login page
import Messages from "@/pages/messages";
import Notifications from "@/pages/notifications";
import NotFound from "@/pages/not-found";
import Redirect from "@/pages/redirect";
import UserProfile from "@/pages/users/UserProfile";
import HowItWorks from "@/pages/how-it-works";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Sitemap from "@/pages/sitemap";
import TestNdaPage from "@/pages/test-nda-page";
import PersonalInfo from "@/pages/personal-info";
import PremiumClients from "@/pages/premium-clients";
import AiAssistant from "@/pages/ai-assistant";
import CompaniesLanding from "@/pages/companies-landing";
import TestSadiq from "@/pages/test-sadiq";

// استيراد صفحات المدونة وصفحات إدارة المدونة
import BlogIndexPage from "@/pages/blog/index";
import BlogPostPage from "@/pages/blog/[slug]";
import BlogManagement from "@/pages/admin/blog-management";
import PremiumClientsManagement from "@/pages/admin/premium-clients-management";
import FeaturedClientsManagement from "@/pages/admin/featured-clients-management";

import SiteSettings from "@/pages/admin/site-settings";
import ContactMessagesPage from "@/pages/admin/contact-messages";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  name: string;
  avatar?: string;
};

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isCompany: boolean;
  isEntrepreneur: boolean;
  isAdmin: boolean;
  logout: () => void;
  login: (userData: User) => void;
}

// Auth context
export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [location, navigate] = useLocation();
  
  // Check if user is logged in with retry logic for sessions
  const { data, isLoading, error, refetch } = useQuery<{user: User}>({
    queryKey: ['/api/auth/user'],
    retry: 3, // محاولة 3 مرات للتأكد من استلام الكوكيز
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000), // تأخير متزايد
  });
  
  // Update user when data changes with localStorage backup
  useEffect(() => {
    console.log("Auth data received:", data);
    if (data && data.user) {
      setUser(data.user);
      // حفظ بيانات المستخدم في localStorage كنسخة احتياطية
      localStorage.setItem('user_session', JSON.stringify(data.user));
    } else if (error || (data === undefined && !isLoading)) {
      // إعادة ضبط حالة المستخدم عند وجود خطأ أو عدم وجود بيانات
      setUser(null);
      localStorage.removeItem('user_session');
    }
  }, [data, error, isLoading]);

  // تنظيف token في حالة فشل المصادقة
  useEffect(() => {
    if (error && error instanceof Error && error.message.includes('401')) {
      localStorage.removeItem('auth_token');
      console.log('تم حذف token منتهي الصلاحية من localStorage');
    }
  }, [error]);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      if (!response.ok) {
        throw new Error("Failed to logout");
      }
      return true;
    },
    onSuccess: () => {
      console.log("تم تسجيل الخروج بنجاح");
      // حذف JWT token من localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_session');
      console.log("تم حذف JWT token من localStorage");
      queryClient.invalidateQueries({queryKey: ['/api/auth/user']});
      setUser(null);
      navigate("/");
    }
  });

  return {
    user,
    isAuthenticated: !!user,
    isCompany: user?.role === "company",
    isEntrepreneur: user?.role === "entrepreneur",
    isAdmin: user?.role === "admin",
    logout: () => logoutMutation.mutate(),
    login: (userData: User) => {
      setUser(userData);
      // إبطال الاستعلامات وإعادة تحميلها للتأكد من التزامن
      queryClient.invalidateQueries({queryKey: ['/api/auth/user']});
    },
  };
};

function App() {
  const auth = useAuth();
  const [location] = useLocation();

  // Skip layout for auth pages
  const isAuthPage = location.startsWith("/auth");

  return (
    <TooltipProvider delayDuration={0}>
      <ScrollToTop />
      {!isAuthPage && (
        location === "/" ? <ModernHeader auth={auth} /> : <Header auth={auth} />
      )}
      <main dir="rtl" lang="ar" className="min-h-screen">
        <Switch>
          <Route path="/" component={() => <Home auth={auth} />} />
          <Route path="/projects" component={() => <Projects auth={auth} />} />
          <Route path="/projects/trending" component={TrendingProjects} />
          <Route path="/projects/:id" component={ProjectDetails} />
          <Route path="/companies/:id" component={CompanyDetails} />

          {/* مساعد الذكاء الاصطناعي للمشاريع */}
          <ProtectedRoute 
            path="/ai-assistant" 
            component={AiAssistant} 
            requiredRole="entrepreneur" 
          />

          <Route path="/for-companies">
            {auth.isAuthenticated && auth.isCompany ? (
              <ForCompanies auth={auth} />
            ) : (
              <NotFound />
            )}
          </Route>
          {/* Main auth route redirects to login */}
          <Route path="/auth" component={() => 
            <Redirect to="/auth/login" />
          } />
          <Route path="/auth/register" component={() => <Register auth={auth} />} />
          <Route path="/auth/login" component={() => <Login auth={auth} />} />
          <Route path="/auth/forgot-password" component={ForgotPassword} />
          <Route path="/auth/reset-password/:token" component={ResetPassword} />
          <Route path="/redirect" component={Redirect} />
          {/* Removed separate admin login route */}
          
          {/* Protected routes - using ProtectedRoute component */}
          {/* Dashboard redirect based on user role */}
          <Route path="/dashboard">
            {auth.isAuthenticated ? (
              auth.isEntrepreneur ? (
                <Redirect to="/dashboard/entrepreneur" />
              ) : auth.isCompany ? (
                <Redirect to="/dashboard/company" />
              ) : auth.isAdmin ? (
                <Redirect to="/dashboard/admin" />
              ) : (
                <NotFound />
              )
            ) : (
              <Redirect to="/auth/login" />
            )}
          </Route>
          <ProtectedRoute 
            path="/dashboard/entrepreneur" 
            component={EntrepreneurDashboard} 
            requiredRole="entrepreneur" 
          />
          <ProtectedRoute 
            path="/dashboard/company" 
            component={CompanyDashboard} 
            requiredRole="company" 
          />
          {/* صفحة المسؤول مع تحقق - باستخدام ProtectedRoute */}
          <ProtectedRoute path="/dashboard/admin" component={AdminDashboard} requiredRole="admin" />
          {/* صفحة المسؤول المبسطة للوصول المباشر - تحويل مباشر إلى لوحة المسؤول الكاملة */}
          <ProtectedRoute path="/admin" component={AdminDashboard} requiredRole="admin" />
          {/* نهاية التعديل المؤقت */}
          {/* صفحة الرسائل: تدعم المسار الأساسي والمسار مع معلمة userId - باستخدام ProtectedRoute */}
          <ProtectedRoute path="/messages" component={Messages} />
          <ProtectedRoute path="/messages/:userId" component={Messages} />
          
          {/* صفحة الإشعارات */}
          <ProtectedRoute path="/notifications" component={Notifications} />
          
          {/* مسار صفحة المستخدم */}
          <Route path="/users/:id" component={UserProfile} />
          
          {/* صفحات المساعدة والدعم */}
          <Route path="/help-center" component={() => (
            <div className="container mx-auto py-8 px-4 md:px-6">
              <h1 className="text-3xl font-bold mb-6">مركز المساعدة</h1>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">الأسئلة الشائعة</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-primary">كيف يمكنني التسجيل في المنصة؟</h3>
                    <p className="text-gray-600 mt-1">يمكنك التسجيل بالنقر على زر "إنشاء حساب" في الصفحة الرئيسية واختيار نوع الحساب (رائد أعمال أو شركة تطوير).</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary">كيف يمكنني إضافة مشروع جديد؟</h3>
                    <p className="text-gray-600 mt-1">بعد تسجيل الدخول كرائد أعمال، يمكنك النقر على "إضافة مشروع" في لوحة التحكم الخاصة بك وملء النموذج المطلوب.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary">ما هي آلية الدفع في المنصة؟</h3>
                    <p className="text-gray-600 mt-1">تعتمد المنصة نظام العربون بنسبة 2.5% من قيمة المشروع، والذي يمثل عمولة المنصة. بعد دفع العربون، تكون المعاملات المالية مباشرة بين الأطراف.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary">كيف يتم ضمان جودة المشاريع المنفذة؟</h3>
                    <p className="text-gray-600 mt-1">تعتمد المنصة نظام تقييم للشركات بعد انتهاء المشاريع، مما يساعد رواد الأعمال على اختيار الشركات ذات السمعة الجيدة.</p>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold mt-8 mb-4">موارد إضافية</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>دليل استخدام المنصة لرواد الأعمال</li>
                  <li>دليل استخدام المنصة للشركات</li>
                  <li>أفضل الممارسات لإضافة مشروع ناجح</li>
                  <li>نصائح لاختيار شركة التطوير المناسبة</li>
                </ul>
              </div>
            </div>
          )} />
          
          {/* الصفحات الإعلامية والمساعدة */}
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/sitemap" component={Sitemap} />
          
          <Route path="/terms" component={Terms} />
          
          <Route path="/privacy" component={Privacy} />
          
          {/* صفحة اختبار PDF */}
          <Route path="/test-nda" component={TestNdaPage} />
          
          {/* صفحة البيانات الشخصية */}
          <ProtectedRoute 
            path="/personal-info" 
            component={PersonalInfo} 
            requiredRole="company" 
          />
          
          {/* صفحات المدونة */}
          <Route path="/blog" component={BlogIndexPage} />
          <Route path="/blog/:slug" component={BlogPostPage} />
          
          {/* صفحات إدارة المسؤول */}
          <ProtectedRoute path="/admin/blog-management" component={BlogManagement} requiredRole="admin" />
          <ProtectedRoute path="/admin/premium-clients-management" component={PremiumClientsManagement} requiredRole="admin" />
          <ProtectedRoute path="/admin/featured-clients-management" component={FeaturedClientsManagement} requiredRole="admin" />

          <ProtectedRoute path="/admin/site-settings" component={SiteSettings} requiredRole="admin" />
          <ProtectedRoute path="/admin/contact-messages" component={ContactMessagesPage} requiredRole="admin" />
          
          {/* صفحة عملاء التميز */}
          <Route path="/premium-clients" component={PremiumClients} />
          
          {/* صفحة هبوط للشركات */}
          <Route path="/companies-landing" component={CompaniesLanding} />
          
          {/* صفحة اختبار تكامل صادق */}
          <Route path="/test-sadiq" component={TestSadiq} />
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAuthPage && <Footer />}
    </TooltipProvider>
  );
}

export default App;
