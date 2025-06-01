import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  roles?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export const AuthGuard = ({
  children,
  roles = [],
  requireAll = false,
  fallback = null,
}: AuthGuardProps) => {
  const { hasAnyRole, hasAllRoles, loading } = useAuth();

  if (loading) {
    return null; // или компонент загрузки
  }

  if (roles.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = requireAll
    ? hasAllRoles(roles)
    : hasAnyRole(roles);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}; 