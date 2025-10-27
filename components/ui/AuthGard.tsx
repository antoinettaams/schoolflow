// components/AuthGuard.tsx
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function AuthGuard({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    if (requiredRole && !auth.hasRole(requiredRole)) {
      router.push('/unauthorized');
      return;
    }

    setIsChecking(false);
  }, [router, requiredRole]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}