// apps/user/app/components/SessionDebug.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function SessionDebug() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('🔍 SESSION DEBUG:', {
      status,
      hasSession: !!session,
      userId: session?.user?.id,
      userToken: (session?.user as any)?.token,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role,
    });
  }, [session, status]);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-20 left-4 z-[9999] bg-black text-white p-3 text-xs max-w-sm rounded shadow-lg">
      <div className="font-bold mb-1">🔍 Session Status</div>
      <div>Status: <span className="text-yellow-400">{status}</span></div>
      <div>Has Session: <span className="text-yellow-400">{session ? '✅ Yes' : '❌ No'}</span></div>
      {session?.user && (
        <>
          <div>User ID: <span className="text-green-400">{session.user.id || '❌'}</span></div>
          <div>Token: <span className="text-green-400">{(session.user as any).token || '❌ MISSING'}</span></div>
          <div>Email: <span className="text-green-400">{session.user.email}</span></div>
        </>
      )}
    </div>
  );
}