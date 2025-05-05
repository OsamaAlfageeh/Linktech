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
  
  // Función para verificar si el usuario tiene el rol requerido
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
        // Verificar si el usuario está autenticado
        if (!auth.isAuthenticated) {
          console.log("Usuario no autenticado, redirigiendo a login");
          return <Redirect to="/auth/login" />;
        }
        
        // Verificar si tiene el rol requerido
        if (requiredRole && !hasRequiredRole()) {
          console.log(`Rol requerido: ${requiredRole}, rol actual: ${auth.user?.role}`);
          return <Redirect to="/auth/login" />;
        }

        // Si pasa todas las verificaciones, renderizar el componente
        return <Component />;
      }}
    </Route>
  );
};