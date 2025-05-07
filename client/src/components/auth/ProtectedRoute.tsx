import React from 'react';
import { Route, Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/App';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  requiredRole?: 'admin' | 'company' | 'entrepreneur' | null;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  path, 
  component: Component, 
  requiredRole = null
}) => {
  const auth = useAuth();
  
  // Function to check if user has the required role
  const hasRequiredRole = (): boolean => {
    if (!requiredRole) return true;
    
    if (requiredRole === 'admin') return auth.isAdmin;
    if (requiredRole === 'company') return auth.isCompany;
    if (requiredRole === 'entrepreneur') return auth.isEntrepreneur;
    
    return false;
  };

  return (
    <Route path={path}>
      {() => {
        // Show loading indicator while fetching authentication data
        if (auth.user === null) {
          console.log("Loading user info...");
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="mr-2">جاري تحميل البيانات...</span>
            </div>
          );
        }
        
        // Check if user is authenticated (auth.user is not null here)
        if (!auth.isAuthenticated) {
          console.log("User not authenticated, redirecting to login");
          return <Redirect to="/auth/login" />;
        }
        
        // Check if user has required role
        if (requiredRole && !hasRequiredRole()) {
          console.log(`Required role: ${requiredRole}, current role: ${auth.user?.role}`);
          
          // إذا كان المستخدم مسجل ولكن ليس لديه الدور المطلوب، فقم بتسجيل الخروج وإعادة التوجيه
          if (auth.isAuthenticated) {
            // تنظيف ذاكرة التخزين المؤقت أولاً
            import("@/lib/queryClient").then(({ queryClient }) => {
              queryClient.clear();
              
              // تسجيل الخروج
              auth.logout();
              
              // إعادة التوجيه إلى صفحة تسجيل الدخول
              return <Redirect to="/auth/login" />;
            });
          }
          
          return <Redirect to="/auth/login" />;
        }

        // If all checks pass, render the component
        console.log("Authentication successful, rendering protected component");
        return <Component />;
      }}
    </Route>
  );
};