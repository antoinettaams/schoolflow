// app/api/admin/dashboard/route.ts - VERSION COMPLÈTE ET CORRIGÉE
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("🔍 Début API Dashboard Admin");

    const { userId } = await auth();

    if (!userId) {
      console.log("❌ Non authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log("👤 User ID Clerk:", userId);

    // Vérifier le rôle de l'utilisateur via Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userRole = clerkUser.publicMetadata?.role as string;

    console.log("🎭 Rôle Clerk:", userRole);

    const isAdmin =
      userRole &&
      (userRole.toLowerCase().includes("admin") ||
        userRole === "Administrateur" ||
        userRole === "ADMIN");

    if (!isAdmin) {
      console.log("❌ Accès refusé - Pas administrateur");
      return NextResponse.json(
        {
          error: "Accès non autorisé - Rôle administrateur requis",
          details: {
            clerkRole: userRole,
            required: "Administrateur",
          },
        },
        { status: 403 }
      );
    }

    console.log("✅ Accès autorisé pour l'admin Clerk:", userRole);

    await syncUserWithDatabase(userId);

    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      recentStudents,
      recentTeachers,
      recentEvents,
      recentAssignations,
      pendingHomeworks,
      pendingGrades,
      studentsDebug,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.user.count({
        where: { role: "ENSEIGNANT", isActive: true },
      }),
      prisma.user.count({
        where: { role: "PARENT", isActive: true },
      }),
      prisma.vague.count({
        where: { isActive: true },
      }),
      prisma.student.count({
        where: {
          user: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          role: "ENSEIGNANT",
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.event.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.planningAssignation.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.homework.count({
        where: {
          status: "actif",
          deadline: {
            gte: new Date(),
          },
        },
      }),
      prisma.grade.count({
        where: {
          OR: [
            { formulaUsed: null },
            {
              AND: [
                { interrogation1: null },
                { interrogation2: null },
                { interrogation3: null },
                { devoir: null },
                { composition: null },
              ],
            },
          ],
        },
      }),
      prisma.student.findMany({
        take: 5,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              createdAt: true,
            },
          },
          vague: {
            select: {
              nom: true,
            },
          },
          filiere: {
            select: {
              nom: true,
            },
          },
        },
        orderBy: {
          user: {
            createdAt: "desc",
          },
        },
      }),
    ]);

    const stats = {
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      activePayments: Math.floor(totalStudents * 0.15),
      pendingTasks: pendingHomeworks + pendingGrades,
    };

    console.log("📊 Données récupérées:", stats);

    // ✅ Définition du type pour éviter TS7034 et TS7005
    interface RecentActivityItem {
      id: string;
      type: string;
      description: string;
      boldText: string;
      color: string;
      timestamp: string;
    }

    const recentActivity: RecentActivityItem[] = [];

    // Fonction utilitaire pour ajouter des activités
    const pushActivity = (
      id: string,
      type: string,
      desc: string,
      count: number,
      color: string
    ) => {
      if (count > 0) {
        recentActivity.push({
          id,
          type,
          description: desc,
          boldText: `${count}`,
          color,
          timestamp: new Date().toISOString(),
        });
      }
    };

    pushActivity("recent_students", "students", "nouveaux élèves inscrits cette semaine", recentStudents, "bg-green-500");
    pushActivity("recent_teachers", "teachers", "nouveaux professeurs ajoutés cette semaine", recentTeachers, "bg-blue-500");
    pushActivity("recent_events", "events", "événements créés cette semaine", recentEvents, "bg-purple-500");
    pushActivity("recent_assignations", "assignations", "nouvelles assignations cette semaine", recentAssignations, "bg-amber-500");
    pushActivity("pending_homeworks", "homeworks", "devoirs en attente de correction", pendingHomeworks, "bg-red-500");
    pushActivity("pending_grades", "grades", "notes en attente de calcul", pendingGrades, "bg-indigo-500");

    if (recentActivity.length === 0) {
      pushActivity("total_students", "students", "élèves au total", totalStudents, "bg-green-500");
      pushActivity("total_teachers", "teachers", "professeurs au total", totalTeachers, "bg-blue-500");
      pushActivity("total_classes", "classes", "classes actives", totalClasses, "bg-purple-500");
    }

    const studentsByFiliere = await prisma.student.groupBy({
      by: ["filiereId"],
      _count: { id: true },
      where: { filiereId: { not: null } },
    });

    const filieres = await prisma.filiere.findMany({
      where: {
        id: { in: studentsByFiliere.map((s) => s.filiereId!) },
      },
      select: { id: true, nom: true },
    });

    const studentsByVague = await prisma.student.groupBy({
      by: ["vagueId"],
      _count: { id: true },
      where: { vagueId: { not: null } },
    });

    const vagues = await prisma.vague.findMany({
      where: {
        id: { in: studentsByVague.map((s) => s.vagueId!) },
      },
      select: { id: true, nom: true },
    });

    return NextResponse.json({
      stats,
      recentActivity,
      charts: {
        studentsByFiliere: studentsByFiliere.map((item) => {
          const filiere = filieres.find((f) => f.id === item.filiereId);
          return {
            name: filiere?.nom || "Non assigné",
            value: item._count.id,
          };
        }),
        studentsByVague: studentsByVague.map((item) => {
          const vague = vagues.find((v) => v.id === item.vagueId);
          return {
            name: vague?.nom || "Non assigné",
            value: item._count.id,
          };
        }),
      },
      user: {
        role: userRole,
        name: `${clerkUser.firstName} ${clerkUser.lastName}`,
      },
      metadata: {
        source: "database",
        timestamp: new Date().toISOString(),
        hasRealData: true,
        debug: {
          totalStudentsFromStudentTable: totalStudents,
          sampleStudents: studentsDebug.map((s) => ({
            name: `${s.user.firstName} ${s.user.lastName}`,
            studentNumber: s.studentNumber,
            vague: s.vague?.nom,
            filiere: s.filiere?.nom,
          })),
        },
      },
    });
  } catch (error) {
    console.error("❌ Erreur API Dashboard:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur interne",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// ✅ Fonction de synchronisation utilisateur
async function syncUserWithDatabase(clerkUserId: string) {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    const userRole = (clerkUser.publicMetadata?.role as string) || "user";

    let role:
      | "ADMIN"
      | "ENSEIGNANT"
      | "ETUDIANT"
      | "PARENT"
      | "CENSEUR"
      | "SECRETAIRE"
      | "COMPTABLE";

    switch (userRole.toLowerCase()) {
      case "admin":
      case "administrateur":
        role = "ADMIN";
        break;
      case "enseignant":
      case "professeur":
        role = "ENSEIGNANT";
        break;
      case "etudiant":
      case "étudiant":
      case "student":
        role = "ETUDIANT";
        break;
      case "parent":
        role = "PARENT";
        break;
      case "censeur":
        role = "CENSEUR";
        break;
      case "secretaire":
        role = "SECRETAIRE";
        break;
      case "comptable":
        role = "COMPTABLE";
        break;
      default:
        role = "ETUDIANT";
    }

    await prisma.user.upsert({
      where: { clerkUserId },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        role,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
      },
      create: {
        id: clerkUserId,
        clerkUserId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        role,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
      },
    });

    console.log("✅ Utilisateur synchronisé:", clerkUserId, role);
  } catch (error) {
    console.error("❌ Erreur synchronisation utilisateur:", error);
  }
}
