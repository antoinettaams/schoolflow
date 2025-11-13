-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CENSEUR', 'SECRETAIRE', 'COMPTABLE', 'ENSEIGNANT', 'ETUDIANT', 'PARENT');

-- CreateEnum
CREATE TYPE "TypeModule" AS ENUM ('theorique', 'pratique', 'mixte', 'projet');

-- CreateEnum
CREATE TYPE "StatutInscription" AS ENUM ('EN_ATTENTE', 'APPROUVE', 'REJETE', 'PAYE_PARTIEL', 'PAYE_COMPLET', 'COMPLET', 'PAYE');

-- CreateEnum
CREATE TYPE "FraisStatut" AS ENUM ('ACTIF', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "TypeFrais" AS ENUM ('INSCRIPTION_UNIVERSEL', 'AUTRES_FRAIS');

-- CreateEnum
CREATE TYPE "StatutDossier" AS ENUM ('EN_ATTENTE', 'COMPLET', 'INCOMPLET', 'VALIDE', 'REJETE');

-- CreateEnum
CREATE TYPE "StatutCarte" AS ENUM ('ACTIVE', 'INACTIVE', 'EN_ATTENTE', 'EXPIREE');

-- CreateEnum
CREATE TYPE "TypeImpression" AS ENUM ('SIMPLE', 'LOT', 'RENOUVELLEMENT');

-- CreateEnum
CREATE TYPE "FactureStatut" AS ENUM ('generee', 'envoyee', 'annulee', 'payee');

-- CreateEnum
CREATE TYPE "TypeRapport" AS ENUM ('VAGUE', 'MENSUEL', 'ANNUEL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "StatutRapport" AS ENUM ('EN_COURS', 'GENERE', 'ERREUR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "filiereId" INTEGER,
    "vagueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vagueNumber" INTEGER,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matiere" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enfantName" TEXT NOT NULL,
    "filiere" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filieres" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "dureeFormation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semestres" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "filiereId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semestres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "coefficient" INTEGER NOT NULL,
    "typeModule" "TypeModule" NOT NULL,
    "description" TEXT,
    "filiereId" INTEGER NOT NULL,
    "semestreId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enseignements" (
    "id" SERIAL NOT NULL,
    "professeurId" TEXT NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "jour" TEXT NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "salleId" TEXT,

    CONSTRAINT "enseignements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vagues" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "semestres" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vague_filiere" (
    "vagueId" TEXT NOT NULL,
    "filiereId" INTEGER NOT NULL,

    CONSTRAINT "vague_filiere_pkey" PRIMARY KEY ("vagueId","filiereId")
);

-- CreateTable
CREATE TABLE "planning_assignations" (
    "id" TEXT NOT NULL,
    "vagueId" TEXT NOT NULL,
    "filiereId" INTEGER NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,
    "scheduleSlots" JSONB NOT NULL,
    "schedulePeriod" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_assignations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "description" TEXT,
    "badge" TEXT NOT NULL DEFAULT 'Important',
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salles" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "capacite" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homeworks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "exerciseType" TEXT NOT NULL,
    "pages" TEXT,
    "content" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'actif',
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherId" TEXT NOT NULL,
    "filiereId" INTEGER,
    "vagueId" TEXT,
    "moduleId" INTEGER,

    CONSTRAINT "homeworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "filiereId" INTEGER NOT NULL,
    "vagueId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "interrogation1" DOUBLE PRECISION,
    "interrogation2" DOUBLE PRECISION,
    "interrogation3" DOUBLE PRECISION,
    "devoir" DOUBLE PRECISION,
    "composition" DOUBLE PRECISION,
    "rang" INTEGER,
    "formulaUsed" TEXT,
    "semestreId" INTEGER,
    "moyenneModule" DOUBLE PRECISION,
    "appreciation" TEXT,
    "estValide" BOOLEAN NOT NULL DEFAULT false,
    "session" TEXT NOT NULL DEFAULT 'principale',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_formulas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "description" TEXT,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "filiereId" INTEGER,
    "vagueId" TEXT,
    "moduleId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "courseTime" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "justified" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "semester" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,
    "vagueId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "chapitre" TEXT NOT NULL,
    "objectif" TEXT NOT NULL,
    "dureePlanifiee" TEXT NOT NULL,
    "dureeReelle" TEXT NOT NULL,
    "progression" TEXT NOT NULL,
    "difficulte" TEXT,
    "evaluation" DOUBLE PRECISION NOT NULL,
    "commentaireProf" TEXT,
    "commentaireCenseur" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscriptions" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutInscription" NOT NULL DEFAULT 'EN_ATTENTE',
    "fraisInscription" INTEGER NOT NULL,
    "fraisPayes" INTEGER NOT NULL DEFAULT 0,
    "datePaiement" TIMESTAMP(3),
    "filiereId" INTEGER,
    "vagueId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modePaiement" TEXT NOT NULL,
    "reference" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frais_formations" (
    "id" TEXT NOT NULL,
    "vagueId" TEXT NOT NULL,
    "filiereId" INTEGER NOT NULL,
    "fraisScolarite" INTEGER NOT NULL,
    "servicesInclus" JSONB NOT NULL,
    "statut" "FraisStatut" NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frais_formations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frais_configurations" (
    "id" TEXT NOT NULL,
    "type" "TypeFrais" NOT NULL,
    "montant" INTEGER NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frais_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "statut" "StatutDossier" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMaj" TIMESTAMP(3) NOT NULL,
    "photoIdentite" TEXT,
    "acteNaissance" TEXT,
    "relevesNotes" TEXT,
    "autresDocuments" JSONB,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartes_etudiantes" (
    "id" TEXT NOT NULL,
    "numeroCarte" TEXT NOT NULL,
    "dateExpiration" TIMESTAMP(3) NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutCarte" NOT NULL DEFAULT 'ACTIVE',
    "includeQRCode" BOOLEAN NOT NULL DEFAULT true,
    "includePhoto" BOOLEAN NOT NULL DEFAULT true,
    "studentId" TEXT NOT NULL,
    "vagueId" TEXT NOT NULL,
    "filiereId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cartes_etudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impressions_cartes" (
    "id" TEXT NOT NULL,
    "carteId" TEXT NOT NULL,
    "dateImpression" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imprimePar" TEXT NOT NULL,
    "typeImpression" "TypeImpression" NOT NULL,
    "nombreCopies" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "impressions_cartes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modeles_cartes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "designConfig" JSONB NOT NULL,
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "modeles_cartes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_cartes" (
    "id" TEXT NOT NULL,
    "carteId" TEXT NOT NULL,
    "ancienStatut" "StatutCarte" NOT NULL,
    "nouveauStatut" "StatutCarte" NOT NULL,
    "raison" TEXT,
    "dateChangement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiePar" TEXT NOT NULL,

    CONSTRAINT "historique_cartes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametres_cartes" (
    "id" TEXT NOT NULL,
    "dureeValiditeMois" INTEGER NOT NULL DEFAULT 12,
    "prefixeNumeroCarte" TEXT NOT NULL DEFAULT 'CF',
    "formatNumeroCarte" TEXT NOT NULL DEFAULT 'CF-YYYY-NNN',
    "logoParDefaut" TEXT,
    "signatureDirecteur" TEXT,
    "mentionsLegales" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parametres_cartes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factures" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "paiementId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "typePaiement" TEXT NOT NULL,
    "methodePaiement" TEXT NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL,
    "montantTotal" INTEGER NOT NULL,
    "statut" "FactureStatut" NOT NULL DEFAULT 'generee',
    "semester" TEXT,
    "notes" TEXT,
    "banque" TEXT,
    "numeroCheque" TEXT,
    "numeroCompte" TEXT,
    "operateurMobile" TEXT,
    "numeroTelephone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facture_items" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "prixUnitaire" INTEGER NOT NULL,
    "montant" INTEGER NOT NULL,

    CONSTRAINT "facture_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "vague" TEXT NOT NULL,
    "filiere" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "debit" INTEGER NOT NULL DEFAULT 0,
    "credit" INTEGER NOT NULL DEFAULT 0,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operation_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "users_clerkUserId_key" ON "users"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "students_studentNumber_key" ON "students"("studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_userId_key" ON "teachers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "parents_userId_key" ON "parents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vagues_nom_key" ON "vagues"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "salles_nom_key" ON "salles"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "grades_studentId_moduleId_filiereId_vagueId_semestreId_sess_key" ON "grades"("studentId", "moduleId", "filiereId", "vagueId", "semestreId", "session");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_studentId_date_courseTime_semester_key" ON "attendances"("studentId", "date", "courseTime", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_email_key" ON "inscriptions"("email");

-- CreateIndex
CREATE UNIQUE INDEX "frais_formations_vagueId_filiereId_key" ON "frais_formations"("vagueId", "filiereId");

-- CreateIndex
CREATE UNIQUE INDEX "frais_configurations_type_key" ON "frais_configurations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_inscriptionId_key" ON "dossiers"("inscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "cartes_etudiantes_numeroCarte_key" ON "cartes_etudiantes"("numeroCarte");

-- CreateIndex
CREATE UNIQUE INDEX "factures_numero_key" ON "factures"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "factures_paiementId_key" ON "factures"("paiementId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_vagueId_fkey" FOREIGN KEY ("vagueId") REFERENCES "vagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semestres" ADD CONSTRAINT "semestres_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignements" ADD CONSTRAINT "enseignements_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignements" ADD CONSTRAINT "enseignements_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignements" ADD CONSTRAINT "enseignements_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "salles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vague_filiere" ADD CONSTRAINT "vague_filiere_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vague_filiere" ADD CONSTRAINT "vague_filiere_vagueId_fkey" FOREIGN KEY ("vagueId") REFERENCES "vagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_assignations" ADD CONSTRAINT "planning_assignations_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_assignations" ADD CONSTRAINT "planning_assignations_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_assignations" ADD CONSTRAINT "planning_assignations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_assignations" ADD CONSTRAINT "planning_assignations_vagueId_fkey" FOREIGN KEY ("vagueId") REFERENCES "vagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_vagueId_fkey" FOREIGN KEY ("vagueId") REFERENCES "vagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_vagueId_fkey" FOREIGN KEY ("vagueId") REFERENCES "vagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_formulas" ADD CONSTRAINT "grade_formulas_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_vagueId_fkey" FOREIGN KEY ("vagueId") REFERENCES "vagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_vagueId_fkey" FOREIGN KEY ("vagueId") REFERENCES "vagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_vagueId_fkey" FOREIGN KEY ("vagueId") REFERENCES "vagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frais_formations" ADD CONSTRAINT "frais_formations_vagueId_fkey" FOREIGN KEY ("vagueId") REFERENCES "vagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frais_formations" ADD CONSTRAINT "frais_formations_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frais_configurations" ADD CONSTRAINT "frais_configurations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartes_etudiantes" ADD CONSTRAINT "cartes_etudiantes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartes_etudiantes" ADD CONSTRAINT "cartes_etudiantes_vagueId_fkey" FOREIGN KEY ("vagueId") REFERENCES "vagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartes_etudiantes" ADD CONSTRAINT "cartes_etudiantes_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impressions_cartes" ADD CONSTRAINT "impressions_cartes_carteId_fkey" FOREIGN KEY ("carteId") REFERENCES "cartes_etudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impressions_cartes" ADD CONSTRAINT "impressions_cartes_imprimePar_fkey" FOREIGN KEY ("imprimePar") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modeles_cartes" ADD CONSTRAINT "modeles_cartes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_cartes" ADD CONSTRAINT "historique_cartes_carteId_fkey" FOREIGN KEY ("carteId") REFERENCES "cartes_etudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_cartes" ADD CONSTRAINT "historique_cartes_modifiePar_fkey" FOREIGN KEY ("modifiePar") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "paiements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture_items" ADD CONSTRAINT "facture_items_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
