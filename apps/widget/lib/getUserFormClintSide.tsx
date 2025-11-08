'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireRole?: string | null;
}

function AuthGuard({ children, requireRole = null }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading, do nothing

    // Not authenticated - redirect to login
    if (status === 'unauthenticated') {
      router.push('/resturantOwnerLogin');
      return;
    }

    // Authenticated but wrong role - redirect
    if (status === 'authenticated' && requireRole && session?.user?.role !== requireRole) {
      router.push('/resturantOwnerLogin'); // Or unauthorized page
    }
  }, [status, session, router, requireRole]);

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show nothing (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  // Wrong role - show nothing (will redirect)
  if (requireRole && session?.user?.role !== requireRole) {
    return null;
  }

  // ✅ All checks passed - show content
  return <>{children}</>;
}

export default AuthGuard;