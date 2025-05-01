import React, { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { apiRequest } from "./lib/queryClient";

// Layout
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";

// Pages
import Home from "@/pages/home";
import Projects from "@/pages/projects";
import ProjectDetails from "@/pages/projects/[id]";
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
import NotFound from "@/pages/not-found";
import Redirect from "@/pages/redirect";
import UserProfile from "@/pages/users/UserProfile";
import HowItWorks from "@/pages/how-it-works";
import About from "@/pages/about";
import Contact from "@/pages/contact";

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
  
  // Check if user is logged in
  const { data, isLoading } = useQuery<{user: User}>({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // Update user when data changes
  useEffect(() => {
    console.log("Auth data received:", data);
    if (data && data.user) {
      setUser(data.user);
    } else {
      // إعادة ضبط حالة المستخدم عند عدم وجود بيانات مصادقة
      setUser(null);
    }
  }, [data]);

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
    login: (userData: User) => setUser(userData),
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
      {!isAuthPage && <Header auth={auth} />}
      <main dir="rtl" lang="ar" className="min-h-screen">
        <Switch>
          <Route path="/" component={() => <Home auth={auth} />} />
          <Route path="/projects" component={() => <Projects auth={auth} />} />
          <Route path="/projects/:id" component={ProjectDetails} />
          <Route path="/companies/:id" component={CompanyDetails} />

          <Route path="/for-companies">
            {auth.isAuthenticated && auth.isCompany ? (
              <ForCompanies auth={auth} />
            ) : (
              <NotFound />
            )}
          </Route>
          {/* Main auth route redirects to login */}
          <Route path="/auth">
            <Redirect to="/auth/login" />
          </Route>
          <Route path="/auth/register" component={() => <Register auth={auth} />} />
          <Route path="/auth/login" component={() => <Login auth={auth} />} />
          <Route path="/auth/forgot-password" component={ForgotPassword} />
          <Route path="/auth/reset-password/:token" component={ResetPassword} />
          <Route path="/redirect" component={Redirect} />
          {/* Removed separate admin login route */}
          
          {/* Protected routes */}
          <Route path="/dashboard/entrepreneur">
            {auth.isAuthenticated && auth.isEntrepreneur ? (
              <EntrepreneurDashboard auth={auth} />
            ) : (
              <NotFound />
            )}
          </Route>
          <Route path="/dashboard/company">
            {auth.isAuthenticated && auth.isCompany ? (
              <CompanyDashboard auth={auth} />
            ) : (
              <NotFound />
            )}
          </Route>
          {/* صفحة المسؤول مع تحقق */}
          <Route path="/dashboard/admin" component={() => (
            auth.isAuthenticated && auth.isAdmin ? (
              <AdminDashboard auth={auth} />
            ) : (
              <Redirect to="/auth/login" />
            )
          )} />
          {/* صفحة المسؤول المبسطة للوصول المباشر - تحويل مباشر إلى لوحة المسؤول الكاملة */}
          <Route path="/admin" component={() => (
            auth.isAuthenticated && auth.isAdmin ? (
              <Redirect to="/dashboard/admin" />
            ) : (
              <Redirect to="/auth/login" />
            )
          )} />
          {/* نهاية التعديل المؤقت */}
          {/* صفحة الرسائل: تدعم المسار الأساسي والمسار مع معلمة userId */}
          <Route path="/messages" component={() => (
            auth.isAuthenticated ? (
              <Messages auth={auth} />
            ) : (
              <Redirect to="/auth/login" />
            )
          )} />
          <Route path="/messages/:userId" component={() => (
            auth.isAuthenticated ? (
              <Messages auth={auth} />
            ) : (
              <Redirect to="/auth/login" />
            )
          )} />
          
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
                    <p className="text-gray-600 mt-1">تعتمد المنصة نظام العربون بنسبة 10% من قيمة المشروع، والذي يمثل عمولة المنصة. بعد دفع العربون، تكون المعاملات المالية مباشرة بين الأطراف.</p>
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
          
          <Route path="/terms" component={() => (
            <div className="container mx-auto py-8 px-4 md:px-6">
              <h1 className="text-3xl font-bold mb-6">الشروط والأحكام</h1>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="prose prose-lg max-w-none">
                  <p>مرحباً بك في منصة تيك لينك. يرجى قراءة الشروط والأحكام التالية بعناية قبل استخدام المنصة. باستخدامك للمنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام.</p>
                  
                  <h2>1. تعريفات</h2>
                  <ul>
                    <li><strong>المنصة:</strong> تشير إلى موقع تيك لينك الإلكتروني وتطبيقاته.</li>
                    <li><strong>المستخدم:</strong> يشير إلى أي شخص يقوم بالتسجيل أو استخدام المنصة.</li>
                    <li><strong>رائد الأعمال:</strong> المستخدم الذي يقوم بنشر مشاريع على المنصة بهدف إيجاد شركات لتنفيذها.</li>
                    <li><strong>الشركة:</strong> المستخدم الذي يقدم خدمات تطوير البرمجيات على المنصة.</li>
                  </ul>
                  
                  <h2>2. التسجيل والحسابات</h2>
                  <p>يجب أن تكون جميع المعلومات المقدمة عند التسجيل صحيحة ودقيقة وحديثة وكاملة. يحق للمنصة تعليق أو إنهاء أي حساب يحتوي على معلومات غير صحيحة.</p>
                  
                  <h2>3. المشاريع والعروض</h2>
                  <p>يتحمل رواد الأعمال مسؤولية دقة المعلومات المقدمة في المشاريع. يحق للمنصة رفض أي مشروع لا يتوافق مع شروط الاستخدام. تتحمل الشركات مسؤولية العروض المقدمة والالتزام بها.</p>
                  
                  <h2>4. العمولات والمدفوعات</h2>
                  <p>تطبق المنصة نظام عمولة بنسبة 10% من قيمة المشروع، تدفع كعربون من قبل رائد الأعمال عند قبول عرض إحدى الشركات. يخصم هذا العربون من القيمة الإجمالية للمشروع.</p>
                  
                  <h2>5. حماية الملكية الفكرية</h2>
                  <p>تحترم المنصة حقوق الملكية الفكرية للآخرين وتتوقع من المستخدمين القيام بالمثل. يمنع منعاً باتاً نشر أي محتوى ينتهك حقوق الملكية الفكرية للغير.</p>
                  
                  <h2>6. المسؤولية والتعويض</h2>
                  <p>لا تتحمل المنصة مسؤولية أي نزاعات تنشأ بين المستخدمين. يتعهد المستخدمون بتعويض المنصة عن أي خسائر أو أضرار تنتج عن انتهاكهم لشروط الاستخدام.</p>
                  
                  <h2>7. التعديلات</h2>
                  <p>تحتفظ المنصة بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعار المستخدمين بالتغييرات من خلال المنصة.</p>
                  
                  <h2>8. القانون المطبق</h2>
                  <p>تخضع هذه الشروط والأحكام لقوانين المملكة العربية السعودية.</p>
                </div>
              </div>
            </div>
          )} />
          
          <Route path="/privacy" component={() => (
            <div className="container mx-auto py-8 px-4 md:px-6">
              <h1 className="text-3xl font-bold mb-6">سياسة الخصوصية</h1>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="prose prose-lg max-w-none">
                  <p>تصف سياسة الخصوصية هذه كيفية جمع واستخدام المعلومات الشخصية التي تقدمها عند استخدام منصة تيك لينك.</p>
                  
                  <h2>1. المعلومات التي نجمعها</h2>
                  <p>قد نقوم بجمع المعلومات التالية:</p>
                  <ul>
                    <li>معلومات التسجيل مثل الاسم والبريد الإلكتروني ورقم الهاتف.</li>
                    <li>معلومات الملف الشخصي مثل المهارات والخبرات والصور.</li>
                    <li>معلومات المشاريع والعروض المقدمة عليها.</li>
                    <li>سجلات المعاملات والمراسلات بين المستخدمين.</li>
                    <li>معلومات تقنية مثل عنوان IP ومعلومات الجهاز والمتصفح.</li>
                  </ul>
                  
                  <h2>2. كيفية استخدام المعلومات</h2>
                  <p>نستخدم المعلومات التي نجمعها لـ:</p>
                  <ul>
                    <li>توفير وتحسين وتطوير خدماتنا.</li>
                    <li>تسهيل التواصل بين المستخدمين.</li>
                    <li>معالجة المدفوعات والعمولات.</li>
                    <li>منع الاحتيال وحماية أمن المنصة.</li>
                    <li>إرسال إشعارات وتحديثات متعلقة بالخدمة.</li>
                  </ul>
                  
                  <h2>3. مشاركة المعلومات</h2>
                  <p>نشارك معلوماتك في الحالات التالية:</p>
                  <ul>
                    <li>مع المستخدمين الآخرين كجزء من عملية التوفيق بين المشاريع والشركات.</li>
                    <li>مع مقدمي الخدمات الذين يساعدوننا في تشغيل المنصة.</li>
                    <li>عند الامتثال للالتزامات القانونية أو حماية حقوقنا.</li>
                  </ul>
                  
                  <h2>4. أمن المعلومات</h2>
                  <p>نتخذ إجراءات أمنية معقولة لحماية معلوماتك الشخصية من الفقدان والوصول غير المصرح به.</p>
                  
                  <h2>5. حقوقك</h2>
                  <p>يمكنك الوصول إلى معلوماتك الشخصية وتصحيحها وتحديثها من خلال إعدادات حسابك. يمكنك أيضًا طلب حذف حسابك، مع مراعاة التزاماتنا القانونية.</p>
                  
                  <h2>6. التغييرات على سياسة الخصوصية</h2>
                  <p>قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإخطارك بأي تغييرات جوهرية من خلال المنصة.</p>
                  
                  <h2>7. الاتصال بنا</h2>
                  <p>إذا كانت لديك أي أسئلة أو مخاوف بشأن سياسة الخصوصية الخاصة بنا، يرجى التواصل معنا عبر البريد الإلكتروني: privacy@linktech.app</p>
                </div>
              </div>
            </div>
          )} />
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAuthPage && <Footer />}
    </TooltipProvider>
  );
}

export default App;
