import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react';

export const metadata = {
  title: 'SchoolFlow - Gestion Scolaire',
  description: 'Plateforme de gestion scolaire complète',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // 🔍 Vérification de la clé Clerk
  console.log("Clerk Key:", clerkPubKey);

  if (!clerkPubKey) throw new Error("Clerk publishable key missing!");

  return (
    <html lang="fr">
      <body className="bg-light">
        <ClerkProvider publishableKey={clerkPubKey}>
          <div className="container-fluid p-0">
            {children}
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}
