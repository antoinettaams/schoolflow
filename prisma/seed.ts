import { prisma } from "../lib/prisma";
import { UserRole } from "@prisma/client";

async function main() {
  console.log("🔹 Début du seed...");

  // ---- FILIERES ----
  const filiereInfo = await prisma.filiere.createMany({
    data: [
      { nom: "Informatique", dureeFormation: "3 ans", description: "Licence informatique" },
      { nom: "Mathematiques", dureeFormation: "3 ans", description: "Licence maths" },
    ],
  });

  console.log("✅ Filières créées");

  // ---- USERS ----
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@school.com",
      firstName: "Admin",
      lastName: "Master",
      role: UserRole.ADMIN,
      clerkUserId: "clerk-admin-id",
      isActive: true,
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: "student@school.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.ETUDIANT,
      clerkUserId: "clerk-student-id",
      isActive: true,
      createdById: adminUser.id,
    },
  });

  const teacherUser = await prisma.user.create({
    data: {
      email: "teacher@school.com",
      firstName: "Alice",
      lastName: "Smith",
      role: UserRole.ENSEIGNANT,
      clerkUserId: "clerk-teacher-id",
      isActive: true,
      createdById: adminUser.id,
    },
  });

  const parentUser = await prisma.user.create({
    data: {
      email: "parent@school.com",
      firstName: "Mary",
      lastName: "Parent",
      role: UserRole.PARENT,
      clerkUserId: "clerk-parent-id",
      isActive: true,
      createdById: adminUser.id,
    },
  });

  console.log("✅ Users créés");

  // ---- STUDENT ----
  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      studentNumber: "STU001",
      vagueNumber: "V001",
      filiereId: 1, // Informatique
    },
  });

  // ---- TEACHER ----
  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      matiere: "Mathematiques",
    },
  });

  // ---- PARENT ----
  const parent = await prisma.parent.create({
    data: {
      userId: parentUser.id,
      enfantName: "John Doe",
      filiere: "Informatique",
      relation: "Père",
    },
  });

  console.log("✅ Students, Teachers, Parents créés");

  // ---- VAGUE ----
  const vague = await prisma.vague.create({
    data: {
      nom: "Vague 1",
      description: "Vague initiale",
      semestres: "1,2,3",
      dateDebut: new Date(),
      dateFin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  // ---- VAGUE-FILIERE pivot ----
  await prisma.vagueFiliere.create({
    data: {
      vagueId: vague.id,
      filiereId: 1,
    },
  });

  console.log("✅ Vagues et pivot créés");

  console.log("🎉 Seed terminé !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
