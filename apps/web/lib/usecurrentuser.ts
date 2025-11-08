import { useSession } from "next-auth/react";

export function useCurrentUser() {
  const { data: session, status } = useSession();
  // console.log(session);
  
  // Check if user is SUPERADMIN
  if (session?.user?.role !== 'SUPERADMIN') {
    return {
      user: null,
      isLoading: status === 'loading',
      isAuthenticated: !!session,
      isSuperAdmin: false
    };
  }
  
  return {
    user: session.user,
    isLoading: status === 'loading',
    isAuthenticated: true,
    isSuperAdmin: true
  };
}