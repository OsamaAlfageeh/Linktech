import React, { useEffect, useState } from 'react';
import { Route, Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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
  const [userState, setUserState] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Direct auth query without dependency on useAuth hook
  const { data: authData, isLoading, error } = useQuery<{user: any}>({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  useEffect(() => {
    console.log("ProtectedRoute - Auth data:", authData);
    if (authData?.user) {
      setUserState(authData.user);
      setAuthChecked(true);
    } else if (error || (!isLoading && !authData)) {
      setUserState(null);
      setAuthChecked(true);
    }
  }, [authData, error, isLoading]);
  
  // Function to check if user has the required role
  const hasRequiredRole = (user: any): boolean => {
    if (!requiredRole) return true;
    
    if (requiredRole === 'admin') return user?.role === 'admin';
    if (requiredRole === 'company') return user?.role === 'company';
    if (requiredRole === 'entrepreneur') return user?.role === 'entrepreneur';
    
    return false;
  };

  return (
    <Route path={path}>
      {() => {
        // Show loading indicator while checking auth
        if (isLoading || !authChecked) {
          console.log("Loading user info...");
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="mr-2">جاري تحميل البيانات...</span>
            </div>
          );
        }
        
        // Check if user is authenticated
        if (!userState) {
          console.log("User not authenticated, redirecting to login");
          return <Redirect to="/auth/login" />;
        }
        
        console.log("Authentication successful, rendering protected component");
        
        // Check if user has required role
        if (requiredRole && !hasRequiredRole(userState)) {
          console.log(`Required role: ${requiredRole}, current role: ${userState?.role}`);
          return <Redirect to="/auth/login" />;
        }

        // Create auth object for the component
        const auth = {
          user: userState,
          isAuthenticated: !!userState,
          isAdmin: userState?.role === 'admin',
          isCompany: userState?.role === 'company',
          isEntrepreneur: userState?.role === 'entrepreneur',
        };

        // If all checks pass, render the component
        console.log("Rendering component with user:", userState);
        return <Component auth={auth} />;
      }}
    </Route>
  );
};