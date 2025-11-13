// app/api/parents/attendance/route.ts
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

// Données mockées TEMPORAIRES pour tester le flux complet
const mockData = {
  student: {
    studentName: "Jean Dupont",
    studentClass: "Terminale A",
    studentStatus: "inscrit" as const,
    filiere: "Sciences",
    vague: "Vague 2024"
  },
  attendance: [ 
    {
      id: "1",
      date: "15/01/2024",
      day: "lundi",
      subject: "Mathématiques",
      time: "08:00-10:00",
      teacher: "Prof. Martin",
      status: "present" as const,
      justified: false,
      reason: "",
      semestre: "S1",
      module: "Algèbre",
      vague: "Vague 2024"
    },
    {
      id: "2",
      date: "16/01/2024",
      day: "mardi",
      subject: "Physique",
      time: "10:00-12:00",
      teacher: "Prof. Durand",
      status: "absent" as const,
      justified: true,
      reason: "Maladie",
      semestre: "S1",
      module: "Mécanique",
      vague: "Vague 2024"
    },
    {
      id: "3",
      date: "17/01/2024",
      day: "mercredi",
      subject: "Chimie",
      time: "14:00-16:00",
      teacher: "Prof. Leroy",
      status: "present" as const,
      justified: false,
      reason: "",
      semestre: "S1",
      module: "Chimie organique",
      vague: "Vague 2024"
    }
  ],
  stats: {
    totalClasses: 20,
    present: 18,
    absent: 2,
    justifiedAbsences: 1,
    unjustifiedAbsences: 1,
    attendanceRate: 90
  },
  filters: {
    vagues: ["Vague 2024", "Vague 2023"],
    modules: ["Mathématiques", "Physique", "Chimie"],
    semestres: ["S1", "S2"]
  }
};

export async function GET() {
  try {
    console.log('🎯 API parents/attendance appelée');
    
    // Vérification utilisateur Clerk
    const user = await currentUser();
    
    if (!user) {
      console.log('❌ Utilisateur non connecté');
      return NextResponse.json(
        { 
          error: 'Non autorisé',
          message: 'Vous devez être connecté'
        },
        { status: 401 }
      );
    }

    console.log('✅ Utilisateur connecté:', user.id);

    // Pour le moment, retourner les données mockées
    // Remplacer plus tard par les vraies données Prisma
    console.log('📦 Retour des données mockées');
    
    return NextResponse.json(mockData);

  } catch (error) {
    console.error('❌ Erreur API:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur',
        message: 'Impossible de charger les données'
      },
      { status: 500 }
    );
  }
}

// Export pour les autres méthodes HTTP
export async function POST() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}