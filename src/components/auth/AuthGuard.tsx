import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = '/login',
}) => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      navigate(redirectTo);
      return;
    }

    if (requireAdmin && !isAdmin) {
      navigate('/dashboard'); // Redirect non-admins to dashboard
      return;
    }
  }, [user, loading, isAdmin, requireAuth, requireAdmin, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect in useEffect
  }

  if (requireAdmin && !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};