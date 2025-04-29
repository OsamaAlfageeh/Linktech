import React, { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { apiRequest } from "./lib/queryClient";

// Layout
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Pages
import Home from "@/pages/home";
import Projects from "@/pages/projects";
import ProjectDetails from "@/pages/projects/[id]";
import Companies from "@/pages/companies";
import CompanyDetails from "@/pages/companies/[id]";
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

// Auth context - simplified for this implementation
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [location, navigate] = useLocation();
  
  // Check if user is logged in
  const { data } = useQuery<{user: User}>({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Update user when data changes
  useEffect(() => {
    console.log("Auth data received:", data);
    if (data && data.user) {
      setUser(data.user);
    }
  }, [data]);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
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
      {!isAuthPage && <Header auth={auth} />}
      <main dir="rtl" lang="ar" className="min-h-screen">
        <Switch>
          <Route path="/" component={() => <Home auth={auth} />} />
          <Route path="/projects" component={() => <Projects auth={auth} />} />
          <Route path="/projects/:id" component={ProjectDetails} />
          <Route path="/companies" component={Companies} />
          <Route path="/companies/:id" component={CompanyDetails} />
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
          <Route path="/messages">
            {auth.isAuthenticated ? (
              <Messages auth={auth} />
            ) : (
              <NotFound />
            )}
          </Route>
          
          {/* مسار صفحة المستخدم */}
          <Route path="/users/:id" component={UserProfile} />
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAuthPage && <Footer />}
    </TooltipProvider>
  );
}

export default App;
