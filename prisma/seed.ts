import { prisma } from "../lib/prisma";
import { UserRole, FraisStatut, TypeFrais } from "@prisma/client";

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

  console.log("✅ Vague créée");

  // ---- STUDENT ----
  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      studentNumber: "STU001",
      vagueNumber: 1, // ✅ CORRIGÉ : nombre au lieu de string
      filiereId: 1, // Informatique
      vagueId: vague.id, // ✅ AJOUT : lien vers la vague
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

  // ---- VAGUE-FILIERE pivot ----
  await prisma.vagueFiliere.create({
    data: {
      vagueId: vague.id,
      filiereId: 1,
    },
  });

  console.log("✅ Pivot Vague-Filière créé");

  // ---- FRAIS DE FORMATION ----
  await prisma.fraisFormation.create({
    data: {
      filiereId: 1,
      vagueId: vague.id,
      fraisScolarite: 885000,
      servicesInclus: [ // ✅ CORRIGÉ : champ Json requis
        "Cours théoriques",
        "Travaux pratiques", 
        "Accès bibliothèque",
        "Support pédagogique"
      ],
      statut: FraisStatut.ACTIF,
    },
  });

  console.log("✅ Frais de formation créés");

  // ---- FRAIS CONFIGURATION ----
  await prisma.fraisConfiguration.create({
    data: {
      type: TypeFrais.INSCRIPTION_UNIVERSEL, // ✅ CORRIGÉ : utilisation de l'enum
      montant: 50000,
      description: "Frais d'inscription universel",
      createdById: adminUser.id, // ✅ CORRIGÉ : champ requis
    },
  });

  console.log("✅ Configuration des frais créée");

  // ---- INSCRIPTION (pour tester les paiements) ----
  const inscription = await prisma.inscription.create({
    data: {
      nom: "Doe",
      prenom: "John",
      email: "john.doe@school.com",
      telephone: "+1234567890",
      fraisInscription: 50000,
      statut: "APPROUVE",
      filiereId: 1,
      vagueId: vague.id,
      createdById: adminUser.id,
    },
  });

  console.log("✅ Inscription créée");

  // ---- PAIEMENT (pour tester) ----
  await prisma.paiement.create({
    data: {
      inscriptionId: inscription.id,
      montant: 50000,
      modePaiement: "especes",
      reference: "PAY-001",
      createdById: adminUser.id,
    },
  });

  console.log("✅ Paiement test créé");

  // ---- MODULE (pour la structure académique) ----
  await prisma.module.create({
    data: {
      nom: "Algorithmique",
      coefficient: 3,
      typeModule: "theorique",
      description: "Introduction aux algorithmes",
      filiereId: 1,
    },
  });

  console.log("✅ Module créé");

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