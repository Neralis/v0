import { useContext } from 'react';
import { AuthContext } from '@/lib/auth-context';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user, loading, login, logout, refreshAuth } = context;

  const hasRole = (role: string) => {
    if (!user || !user.groups) return false;
    return user.groups.includes(role);
  };

  const hasAnyRole = (roles: string[]) => {
    if (!user || !user.groups) return false;
    return roles.some(role => hasRole(role));
  };

  const hasAllRoles = (roles: string[]) => {
    if (!user || !user.groups) return false;
    return roles.every(role => hasRole(role));
  };

  return {
    user,
    loading,
    login,
    logout,
    refreshAuth,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAuthenticated: user?.is_authenticated ?? false,
  };
}; 