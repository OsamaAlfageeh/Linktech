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
import ForCompanies from "@/pages/for-companies";
import Register from "@/pages/auth/register";
import Login from "@/pages/auth/login";
import EntrepreneurDashboard from "@/pages/dashboard/entrepreneur";
import CompanyDashboard from "@/pages/dashboard/company";
import AdminDashboard from "@/pages/dashboard/admin";
// Removed AdminLogin import as it's now integrated with the main login page
import Messages from "@/pages/messages";
import NotFound from "@/pages/not-found";
import Redirect from "@/pages/redirect";
import UserProfile from "@/pages/users/UserProfile";

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
  const isAuthPage = location.startsWith("/auth/");

  return (
    <TooltipProvider delayDuration={0}>
      <ScrollToTop />
      {!isAuthPage && <Header auth={auth} />}
      <main dir="rtl" lang="ar" className="min-h-screen">
        <Switch>
          <Route path="/" component={() => <Home auth={auth} />} />
          <Route path="/projects" component={() => <Projects auth={auth} />} />
          <Route path="/projects/:id" component={ProjectDetails} />

          <Route path="/for-companies">
            {auth.isAuthenticated && auth.isCompany ? (
              <ForCompanies auth={auth} />
            ) : (
              <NotFound />
            )}
          </Route>
          <Route path="/auth/register" component={() => <Register auth={auth} />} />
          <Route path="/auth/login" component={() => <Login auth={auth} />} />
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
          {/* صفحة المسؤول بدون تحقق (مؤقتاً) */}
          <Route path="/dashboard/admin" component={() => <AdminDashboard auth={auth} />} />
          {/* صفحة المسؤول المبسطة للوصول المباشر */}
          <Route path="/admin">
            <div className="container mx-auto p-4 sm:p-6">
              <h1 className="text-3xl font-bold mb-6">لوحة المسؤول البسيطة</h1>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <p className="mb-4">تم تسجيل دخولك بنجاح كمسؤول.</p>
                <a href="/dashboard/admin" className="inline-block bg-primary text-white px-4 py-2 rounded-md">
                  الذهاب إلى لوحة المسؤول الكاملة
                </a>
              </div>
            </div>
          </Route>
          {/* نهاية التعديل المؤقت */}
          {/* صفحة الرسائل: تدعم المسار الأساسي والمسار مع معلمة userId */}
          <Route path="/messages">
            {auth.isAuthenticated ? (
              <Messages auth={auth} />
            ) : (
              <NotFound />
            )}
          </Route>
          <Route path="/messages/:userId">
            {auth.isAuthenticated ? (
              <Messages auth={auth} />
            ) : (
              <NotFound />
            )}
          </Route>
          
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
          
          <Route path="/contact" component={() => (
            <div className="container mx-auto py-8 px-4 md:px-6">
              <h1 className="text-3xl font-bold mb-6">تواصل معنا</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">البريد الإلكتروني</h3>
                  <p className="text-gray-600">support@techlink.sa</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">الهاتف</h3>
                  <p className="text-gray-600">+966 12 345 6789</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">العنوان</h3>
                  <p className="text-gray-600">الرياض، المملكة العربية السعودية</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
                <h2 className="text-xl font-semibold mb-4">اتصل بنا</h2>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="أدخل اسمك" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                      <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="أدخل بريدك الإلكتروني" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="أدخل موضوع الرسالة" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الرسالة</label>
                    <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="اكتب رسالتك هنا"></textarea>
                  </div>
                  <div>
                    <button type="button" className="px-4 py-2 bg-primary text-white rounded-md">إرسال الرسالة</button>
                  </div>
                </form>
              </div>
            </div>
          )} />
          
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
                  <p>إذا كانت لديك أي أسئلة أو مخاوف بشأن سياسة الخصوصية الخاصة بنا، يرجى التواصل معنا عبر البريد الإلكتروني: privacy@techlink.sa</p>
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
