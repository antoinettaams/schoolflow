import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vagueId = searchParams.get('vague');
    const filiereId = searchParams.get('filiere');

    console.log('📊 Chargement des résultats académiques...');

    // Récupérer les étudiants avec leurs notes et informations
    const studentsWithGrades = await prisma.student.findMany({
      where: {
        ...(vagueId && vagueId !== 'all' ? { vagueId } : {}),
        ...(filiereId && filiereId !== 'all' ? { filiereId: parseInt(filiereId) } : {}),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        filiere: true,
        vague: true,
        grades: {
          include: {
            module: true,
            semestre: true,
          }
        },
        attendance: {
          select: {
            status: true,
            date: true,
          }
        }
      },
    });

    if (studentsWithGrades.length === 0) {
      return NextResponse.json({ 
        students: [],
        stats: getEmptyStats(),
        vagues: await getVagues(),
        filieres: await getFilieres()
      });
    }

    // Transformer les données pour le frontend
    const transformedStudents = studentsWithGrades.map(student => {
      const grades = student.grades;
      
      // Calculer la moyenne générale de l'étudiant
      const moyenneGenerale = calculateStudentAverage(grades);
      
      // Calculer le taux de présence
      const presenceRate = calculatePresenceRate(student.attendance);
      
      // Déterminer le statut académique
      const statut = determineAcademicStatus(moyenneGenerale);

      return {
        id: student.id,
        nom: student.user.lastName,
        prenom: student.user.firstName,
        email: student.user.email,
        filiere: student.filiere?.nom || 'Non assigné',
        vagueId: student.vague?.id || '',
        vagueName: student.vague?.nom || 'Non assigné',
        moyenneGenerale,
        rang: 0, // Calculé plus tard
        statut,
        presence: presenceRate,
        dernierSemestre: getLatestSemester(grades),
        notes: grades.map(grade => ({
          matiere: grade.module.nom,
          note: grade.moyenneModule || 0,
          coefficient: grade.module.coefficient,
          appreciation: grade.appreciation || 'Non évalué'
        }))
      };
    });

    // Calculer les rangs
    const rankedStudents = calculateRanks(transformedStudents);
    
    // Calculer les statistiques globales
    const stats = calculateOverallStats(rankedStudents);

    // Récupérer les filtres disponibles
    const vagues = await getVagues();
    const filieres = await getFilieres();

    console.log(`✅ ${rankedStudents.length} étudiants chargés avec leurs résultats`);

    return NextResponse.json({
      students: rankedStudents,
      stats,
      vagues,
      filieres
    });

  } catch (error) {
    console.error('❌ Erreur API résultats académiques:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des résultats' },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires
function calculateStudentAverage(grades: any[]): number {
  if (grades.length === 0) return 0;
  
  const totalPoints = grades.reduce((sum, grade) => {
    const note = grade.moyenneModule || 0;
    const coefficient = grade.module.coefficient || 1;
    return sum + (note * coefficient);
  }, 0);
  
  const totalCoefficients = grades.reduce((sum, grade) => {
    return sum + (grade.module.coefficient || 1);
  }, 0);
  
  return totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
}

function calculatePresenceRate(attendance: any[]): number {
  if (attendance.length === 0) return 0;
  
  const presentCount = attendance.filter(a => 
    a.status.toLowerCase() === 'present' || 
    a.status.toLowerCase() === 'présent'
  ).length;
  
  return (presentCount / attendance.length) * 100;
}

function determineAcademicStatus(moyenne: number): string {
  if (moyenne >= 16) return 'excellent';
  if (moyenne >= 14) return 'tres_bien';
  if (moyenne >= 12) return 'bien';
  if (moyenne >= 10) return 'moyen';
  if (moyenne >= 8) return 'insuffisant';
  return 'echec';
}

function getLatestSemester(grades: any[]): string {
  if (grades.length === 0) return 'Non disponible';
  
  const latestGrade = grades.reduce((latest, grade) => {
    if (!latest || new Date(grade.createdAt) > new Date(latest.createdAt)) {
      return grade;
    }
    return latest;
  });
  
  return latestGrade.semestre?.nom || 'Semestre inconnu';
}

function calculateRanks(students: any[]): any[] {
  const sortedStudents = [...students].sort((a, b) => b.moyenneGenerale - a.moyenneGenerale);
  
  return sortedStudents.map((student, index) => ({
    ...student,
    rang: index + 1
  }));
}

function calculateOverallStats(students: any[]): any {
  if (students.length === 0) return getEmptyStats();
  
  const totalStudents = students.length;
  const moyenneGenerale = students.reduce((sum, student) => sum + student.moyenneGenerale, 0) / totalStudents;
  const meilleureMoyenne = Math.max(...students.map(s => s.moyenneGenerale));
  const tauxReussite = (students.filter(s => s.moyenneGenerale >= 10).length / totalStudents) * 100;
  const excellents = students.filter(s => s.statut === 'excellent').length;
  const echecs = students.filter(s => s.statut === 'echec').length;

  return {
    totalStudents,
    moyenneGenerale,
    meilleureMoyenne,
    tauxReussite,
    excellents,
    echecs
  };
}

function getEmptyStats() {
  return {
    totalStudents: 0,
    moyenneGenerale: 0,
    meilleureMoyenne: 0,
    tauxReussite: 0,
    excellents: 0,
    echecs: 0
  };
}

async function getVagues() {
  const vagues = await prisma.vague.findMany({
    where: { isActive: true },
    select: { id: true, nom: true, dateDebut: true, dateFin: true }
  });
  
  return vagues.map(v => ({
    id: v.id,
    name: v.nom,
    startDate: v.dateDebut.toISOString().split('T')[0],
    endDate: v.dateFin.toISOString().split('T')[0]
  }));
}

async function getFilieres() {
  const filieres = await prisma.filiere.findMany({
    select: { id: true, nom: true }
  });
  
  return filieres.map(f => ({
    id: f.id.toString(),
    name: f.nom
  }));
}