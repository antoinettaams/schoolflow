// app/api/censor/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Début API dashboard censeur');
    
    const user = await currentUser();
    console.log('👤 User Clerk:', user?.id, user?.emailAddresses?.[0]?.emailAddress);
    
    if (!user) {
      console.log('❌ Utilisateur non authentifié');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Debug des métadonnées
    console.log('📋 Métadonnées publiques:', user.publicMetadata);
    
    const userRole = user.publicMetadata?.role;
    console.log('🎭 Rôle détecté:', userRole);

    // CORRECTION : Vérification insensible à la casse
    const userRoleNormalized = String(userRole).toUpperCase();
    const allowedRoles = ['CENSEUR', 'CENSEUR', 'ADMIN', 'SUPER_ADMIN']; // 'Censeur' devient 'CENSEUR'
    
    console.log('🎭 Rôle normalisé:', userRoleNormalized);
    
    if (!userRole || !allowedRoles.includes(userRoleNormalized)) {
      console.log('🚫 Accès refusé - Rôle insuffisant:', userRole);
      return NextResponse.json({ 
        error: 'Accès non autorisé',
        details: `Rôle requis: CENSEUR. Votre rôle: ${userRole || 'Non défini'}`,
        yourRole: userRole,
        requiredRole: 'CENSEUR',
        allowedRoles: allowedRoles
      }, { status: 403 });
    }

    console.log('✅ Accès autorisé pour le rôle:', userRole);

    // Récupération des données de base
    const basicData = await getBasicDashboardData();
    
    const dashboardData = {
      ...basicData,
      userInfo: {
        role: userRole,
        normalizedRole: userRoleNormalized,
        email: user.emailAddresses[0]?.emailAddress,
        name: `${user.firstName} ${user.lastName}`
      },
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Données dashboard récupérées avec succès');
    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('💥 Erreur API dashboard censeur:', error);
    
    const fallbackData = await getFallbackData();
    return NextResponse.json(fallbackData);
  }
}

// Les autres fonctions restent identiques...
async function getBasicDashboardData() {
  try {
    const [
      pendingAbsences,
      activeVagues,
      activeFilieres,
      totalStudents,
      totalTeachers,
    ] = await Promise.all([
      prisma.attendance.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999))
          },
          status: 'absent',
          justified: false
        }
      }).catch(() => 0),

      prisma.vague.count({
        where: {
          isActive: true,
          dateFin: { gte: new Date() }
        }
      }).catch(() => 0),

      prisma.filiere.count().catch(() => 0),

      prisma.student.count({
        where: { user: { isActive: true } }
      }).catch(() => 0),

      prisma.teacher.count({
        where: { user: { isActive: true } }
      }).catch(() => 0),
    ]);

    return {
      pendingAbsences,
      pendingRetards: 0,
      activeVagues,
      activeFilieres,
      teacherEvaluations: 0,
      totalStudents,
      totalTeachers,
      stats: {
        attendanceRate: 85,
        disciplineIncidents: pendingAbsences,
        pedagogicalProgress: 75
      },
      quickStats: {
        totalClasses: activeVagues,
        activeTeachers: totalTeachers,
        completedEvaluations: 0
      },
      recentActivities: [],
      urgentTasks: []
    };
  } catch (error) {
    console.error('Erreur données de base:', error);
    return getFallbackData();
  }
}

function getFallbackData() {
  return {
    pendingAbsences: 0,
    pendingRetards: 0,
    activeVagues: 0,
    activeFilieres: 0,
    teacherEvaluations: 0,
    totalStudents: 0,
    totalTeachers: 0,
    stats: {
      attendanceRate: 0,
      disciplineIncidents: 0,
      pedagogicalProgress: 0
    },
    quickStats: {
      totalClasses: 0,
      activeTeachers: 0,
      completedEvaluations: 0
    },
    recentActivities: [],
    urgentTasks: [],
    lastUpdated: new Date().toISOString(),
    fallback: true
  };
}