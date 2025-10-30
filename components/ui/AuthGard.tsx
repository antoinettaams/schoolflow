"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';

export default function AuthGuard({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    if (requiredRole && user?.publicMetadata?.role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }

    setIsChecking(false);
  }, [isSignedIn, user, requiredRole, router, openSignIn]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l&apos;authentification...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}