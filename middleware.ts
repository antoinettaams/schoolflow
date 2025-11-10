// middleware.ts - VERSION CORRIGÉE
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/(.*)',
  '/api/webhooks(.*)',
  '/forgot-password(.*)',
  '/not-found(.*)',
  '/signout(.*)',
  '/unauthorized',
]);

// 🎯 CONFIGURATION CORRIGÉE - AJOUT DE LA SECRÉTAIRE
const rolePermissions = {
  // ADMIN - Accès à tous les dashboards
  'Administrateur': [
    '/dashboard/admin',
    '/dashboard/student',
    '/dashboard/censor',
    '/dashboard/teacher',
    '/dashboard/secretaire',
    '/dashboard/parent',
    '/dashboard/comptable',
    '/auth/signup'
  ],

  // SECRÉTAIRE - Son dashboard et inscription étudiants
  'Secretaire': [
    '/dashboard/secretaire',
    '/auth/signup'
  ],

  // CENSEUR - Son dashboard uniquement
  'Censeur': [
    '/dashboard/censor'
  ],
  
  // PROFESSEUR - Son dashboard uniquement
  'Enseignant': [
    '/dashboard/teacher'
  ],
  
  // PARENT - Son dashboard uniquement
  'Parent': [
    '/dashboard/parent'
  ],
  
  // COMPTABLE - Son dashboard uniquement
  'Comptable': [
    '/dashboard/comptable'
  ],
  
  // ÉLÈVE - Son dashboard uniquement
  'Etudiant': [
    '/dashboard/student'
  ]
};

// 🔍 Fonction pour vérifier les permissions
const hasPermission = (userRole: string, pathname: string): boolean => {
  const allowedPaths = rolePermissions[userRole as keyof typeof rolePermissions] || [];
  
  console.log(`🔍 Vérification permission: ${userRole} -> ${pathname}`);
  console.log(`🔍 Chemins autorisés:`, allowedPaths);
  
  const hasAccess = allowedPaths.some(allowedPath => {
    return pathname.startsWith(allowedPath);
  });
  
  console.log(`🔍 Accès ${hasAccess ? 'AUTORISÉ' : 'REFUSÉ'}`);
  return hasAccess;
};

// 🗺️ Mappage des redirections par rôle
const getRoleDashboard = (userRole: string): string => {
  const dashboardMap: Record<string, string> = {
    'Administrateur': '/dashboard/admin',
    'Etudiant': '/dashboard/student',
    'Enseignant': '/dashboard/teacher', 
    'Parent': '/dashboard/parent',
    'Censeur': '/dashboard/censor',
    'Comptable': '/dashboard/comptable',
    'Secretaire': '/dashboard/secretaire',
  };
  
  return dashboardMap[userRole] || '/unauthorized';
};

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;
  const pathname = url.pathname;

  console.log('🔍 Middleware - Path:', pathname);
  console.log('🔍 Middleware - User ID:', userId);

  // 🔥 PROTECTION DE /auth/signup - ADMINS ET SECRÉTAIRES
  if (pathname.toLowerCase() === '/auth/signup') {
    console.log('🛡️  === DÉBUT PROTECTION SIGNUP ===');
    
    if (!userId) {
      console.log('🚫 Non connecté - Redirection vers signin');
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const userRole = user.publicMetadata.role as string;
      
      console.log('🔍 Rôle depuis API Clerk:', userRole);

      // Vérification admin ou secrétaire
      const isAdmin = userRole && (
        userRole.toLowerCase().includes('admin') || 
        userRole === 'Administrateur' ||
        userRole.toLowerCase().includes('administrateur')
      );

      const isSecretaire = userRole && (
        userRole.toLowerCase().includes('secretaire') || 
        userRole === 'Secrétaire' ||
        userRole.toLowerCase().includes('secrétaire')
      );
      
      console.log('🔍 Est admin?', isAdmin);
      console.log('🔍 Est secrétaire?', isSecretaire);
      
      if (!isAdmin && !isSecretaire) {
        console.log('🚫 Accès refusé à /auth/signup - Rôle non autorisé:', userRole);
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }

      console.log('✅ Accès autorisé à /auth/signup');
      
    } catch (error) {
      console.error('❌ Erreur API Clerk:', error);
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    console.log('🛡️  === FIN PROTECTION SIGNUP ===');
  }

  // ✅ Routes publiques - accès libre
  if (isPublicRoute(req)) {
    if (userId && (pathname === '/auth/signin' || pathname === '/')) {
      console.log('✅ Utilisateur connecté sur page auth, redirection vers dashboard');
      
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const userRole = user.publicMetadata.role as string;
        const dashboard = getRoleDashboard(userRole);
        
        console.log(`🎯 Rôle détecté: ${userRole}`);
        console.log(`🎯 Redirection automatique vers: ${dashboard}`);
        
        if (dashboard === '/unauthorized') {
          console.log('❌ Aucun dashboard trouvé pour ce rôle');
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }
        
        return NextResponse.redirect(new URL(dashboard, req.url));
      } catch (error) {
        console.error('❌ Erreur récupération rôle:', error);
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
    return NextResponse.next();
  }

  // 🚫 Utilisateur non connecté → redirection vers la page de connexion
  if (!userId) {
    console.log('🚫 Utilisateur non connecté, redirection vers signin');
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // 🔐 VÉRIFICATION DES RÔLES POUR LES ROUTES PROTÉGÉES
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/auth/signup')) {
    console.log('🔐 === VÉRIFICATION DES RÔLES ===');
    
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const userRole = user.publicMetadata.role as string;
      
      console.log('🔍 Rôle utilisateur:', userRole);
      console.log('🔍 Chemin demandé:', pathname);

      // Vérifier les permissions
      if (!hasPermission(userRole, pathname)) {
        console.log(`🚫 Accès refusé: ${userRole} ne peut pas accéder à ${pathname}`);
        
        const userDashboard = getRoleDashboard(userRole);
        console.log(`🎯 Redirection vers: ${userDashboard}`);
        
        // Pour /auth/signup, rediriger vers le dashboard si pas autorisé
        if (pathname === '/auth/signup') {
          return NextResponse.redirect(new URL(userDashboard, req.url));
        }
        
        return NextResponse.redirect(new URL(userDashboard, req.url));
      }

      console.log(`✅ Accès autorisé: ${userRole} → ${pathname}`);
      
    } catch (error) {
      console.error('❌ Erreur vérification rôle:', error);
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 