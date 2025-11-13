import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    console.log('🔍 Recherche RÉELLE étudiant ID:', studentId);

    // APPROCHE SIMPLIFIÉE : Récupérer les données étape par étape
    const student = await prisma.student.findFirst({
      where: { 
        OR: [
          { id: studentId },
          { userId: studentId }
        ]
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        filiere: {
          select: {
            id: true,
            nom: true,
          },
        },
        vague: {
          select: {
            nom: true,
          },
        },
      },
    });

    console.log('📊 Étudiant trouvé:', student ? `${student.user.firstName} ${student.user.lastName}` : 'NON');

    if (!student) {
      const allStudents = await prisma.student.findMany({
        include: { 
          user: { 
            select: { 
              firstName: true, 
              lastName: true 
            } 
          } 
        },
        take: 10 // Limiter pour le debug
      });
      
      console.log('👥 Étudiants disponibles:', allStudents.map(s => ({ 
        id: s.id, 
        userId: s.userId,
        nom: `${s.user.firstName} ${s.user.lastName}` 
      })));
      
      return NextResponse.json({ 
        error: 'Étudiant non trouvé',
        studentIdRecherche: studentId,
        availableStudents: allStudents.map(s => ({ 
          id: s.id, 
          userId: s.userId,
          nom: `${s.user.firstName} ${s.user.lastName}` 
        }))
      }, { status: 404 });
    }

    if (!student.filiere) {
      return NextResponse.json({ 
        error: 'Cet étudiant n\'est pas assigné à une filière',
        student: {
          id: student.id,
          userId: student.userId,
          nom: student.user.lastName,
          prenom: student.user.firstName,
          email: student.user.email
        }
      }, { status: 404 });
    }

    // RÉCUPÉRATION SÉPARÉE DES DONNÉES pour éviter les relations complexes

    // 1. Récupérer les notes
    const grades = await prisma.grade.findMany({
      where: { 
        studentId: student.id 
      },
      include: {
        module: {
          include: {
            semestre: true,
          },
        },
        semestre: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    console.log('📝 Notes trouvées:', grades.length);

    // 2. Récupérer les modules de la filière
    const filiereWithModules = await prisma.filiere.findUnique({
      where: { id: student.filiere.id },
      include: {
        modules: {
          include: {
            semestre: true,
          },
        },
        semestres: {
          include: {
            modules: true,
          },
          orderBy: { nom: 'asc' }
        },
      },
    });

    // 3. Récupérer les présences
    const attendance = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
        date: {
          gte: new Date(new Date().getFullYear(), 0, 1), // Depuis début d'année
        },
      },
    });

    console.log('📅 Présences trouvées:', attendance.length);
    console.log('📚 Modules de la filière:', filiereWithModules?.modules.length || 0);

    // Afficher le détail des notes pour debug
    grades.forEach(grade => {
      console.log('📖 Note détail:', {
        module: grade.module?.nom,
        studentId: grade.studentId,
        interrogation1: grade.interrogation1,
        interrogation2: grade.interrogation2,
        interrogation3: grade.interrogation3,
        devoir: grade.devoir,
        composition: grade.composition,
        moyenneModule: grade.moyenneModule,
        estValide: grade.estValide,
        appreciation: grade.appreciation
      });
    });

    // CALCULS AVEC DONNÉES RÉELLES
    const allGrades = grades;
    
    // 1. Calculer la moyenne générale RÉELLE
    const weightedSum = allGrades.reduce((sum, grade) => {
      const coefficient = grade.module?.coefficient || 1;
      
      // Priorité à moyenneModule, sinon calculer
      let note = 0;
      if (grade.moyenneModule !== null && grade.moyenneModule !== undefined) {
        note = grade.moyenneModule;
      } else {
        // Calculer à partir des notes individuelles
        const notes = [
          grade.interrogation1, 
          grade.interrogation2, 
          grade.interrogation3, 
          grade.devoir, 
          grade.composition
        ].filter(n => n !== null && n !== undefined) as number[];
        
        note = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0;
      }
      
      return sum + note * coefficient;
    }, 0);

    const totalCoefficients = allGrades.reduce((sum, grade) => {
      return sum + (grade.module?.coefficient || 1);
    }, 0);

    const moyenneGenerale = totalCoefficients > 0 ? weightedSum / totalCoefficients : 0;

    // 2. Calculer les crédits RÉELS
    const totalCredits = filiereWithModules?.modules.reduce((sum, module) => 
      sum + module.coefficient, 0) || 0;
    
    const obtainedCredits = allGrades
      .filter(grade => grade.estValide === true)
      .reduce((sum, grade) => 
        sum + (grade.module?.coefficient || 0), 0);

    // 3. Calculer la présence RÉELLE
    const totalAttendance = attendance.length;
    const presentAttendance = attendance.filter(a => a.status === 'present').length;
    const presenceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;

    // 4. Organiser les données par semestre RÉEL
    const semestresData = filiereWithModules?.semestres.map(semestre => {
      const semestreGrades = allGrades.filter(grade => grade.semestreId === semestre.id);
      const semestreModules = filiereWithModules.modules.filter(module => module.semestreId === semestre.id);

      // Calculer la moyenne du semestre RÉELLE
      const semestreWeightedSum = semestreGrades.reduce((sum, grade) => {
        const coefficient = grade.module?.coefficient || 1;
        
        let note = 0;
        if (grade.moyenneModule !== null && grade.moyenneModule !== undefined) {
          note = grade.moyenneModule;
        } else {
          const notes = [
            grade.interrogation1, 
            grade.interrogation2, 
            grade.interrogation3, 
            grade.devoir, 
            grade.composition
          ].filter(n => n !== null && n !== undefined) as number[];
          
          note = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0;
        }
        
        return sum + note * coefficient;
      }, 0);

      const semestreTotalCoefficients = semestreGrades.reduce((sum, grade) => {
        return sum + (grade.module?.coefficient || 1);
      }, 0);

      const moyenneSemestre = semestreTotalCoefficients > 0 ? semestreWeightedSum / semestreTotalCoefficients : 0;

      // Crédits du semestre RÉELS
      const creditsObtenus = semestreGrades
        .filter(grade => grade.estValide === true)
        .reduce((sum, grade) => sum + (grade.module?.coefficient || 0), 0);

      const creditsTotaux = semestreModules.reduce((sum, module) => sum + module.coefficient, 0);

      // Matières RÉELLES avec notes RÉELLES
      const matieres = semestreModules.map(module => {
        const grade = semestreGrades.find(g => g.moduleId === module.id);
        
        // Note RÉELLE
        let noteReelle = 0;
        if (grade?.moyenneModule !== null && grade?.moyenneModule !== undefined) {
          noteReelle = grade.moyenneModule;
        } else if (grade) {
          const notes = [
            grade.interrogation1, 
            grade.interrogation2, 
            grade.interrogation3, 
            grade.devoir, 
            grade.composition
          ].filter(n => n !== null && n !== undefined) as number[];
          
          noteReelle = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0;
        }

        // Statut RÉEL
        let statut: 'valide' | 'echec' | 'en_cours' = 'en_cours';
        if (grade) {
          if (grade.estValide === true) {
            statut = 'valide';
          } else if (noteReelle > 0 && noteReelle < 10) {
            statut = 'echec';
          }
        }

        return {
          id: module.id.toString(),
          nom: module.nom,
          coefficient: module.coefficient,
          note: Number(noteReelle.toFixed(2)),
          appreciation: grade?.appreciation || 'Non noté',
          professeur: grade?.teacher ? 
            `${grade.teacher.user.firstName} ${grade.teacher.user.lastName}` : 'Non assigné',
          credit: module.coefficient,
          statut: statut,
        };
      });

      return {
        semestre: semestre.nom,
        matieres,
        moyenneSemestre: Number(moyenneSemestre.toFixed(2)),
        creditsObtenus,
        creditsTotaux,
      };
    }) || [];

    // 5. Préparer la réponse avec DONNÉES RÉELLES
    const responseData = {
      id: student.id,
      nom: student.user.lastName,
      prenom: student.user.firstName,
      email: student.user.email,
      filiere: student.filiere.nom,
      vagueName: student.vague?.nom || 'Non assigné',
      moyenneGenerale: Number(moyenneGenerale.toFixed(2)),
      rang: allGrades[0]?.rang || 1,
      presence: Math.round(presenceRate),
      creditsObtenus: obtainedCredits,
      creditsTotaux: totalCredits,
      filiereDetails: {
        id: student.filiere.id.toString(),
        nom: student.filiere.nom,
        modules: semestresData,
      },
      debug: {
        totalGrades: allGrades.length,
        totalAttendance: attendance.length,
        totalModules: filiereWithModules?.modules.length || 0,
        totalSemestres: filiereWithModules?.semestres.length || 0,
        studentId: student.id,
        userId: student.userId
      }
    };

    console.log('✅ DONNÉES RÉELLES FINALES:');
    console.log('📊 Moyenne générale:', responseData.moyenneGenerale);
    console.log('🎓 Crédits:', responseData.creditsObtenus, '/', responseData.creditsTotaux);
    console.log('📅 Présence:', responseData.presence + '%');
    console.log('📚 Semestres:', responseData.filiereDetails.modules.length);

    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('❌ Erreur API:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}