-- AlterTable
ALTER TABLE "operation" ADD COLUMN     "inscriptionId" TEXT,
ADD COLUMN     "paiementId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manuel',
ADD COLUMN     "statut" TEXT NOT NULL DEFAULT 'comptabilise',
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'manuel';

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "parentId" TEXT;

-- CreateTable
CREATE TABLE "bilans" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "type" "TypeRapport" NOT NULL,
    "vagueId" TEXT,
    "periode" TEXT NOT NULL,
    "dateGeneration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generePar" TEXT NOT NULL,
    "statut" "StatutRapport" NOT NULL DEFAULT 'GENERE',
    "taille" TEXT,
    "resume" TEXT,
    "inclusions" JSONB,
    "statistiques" JSONB,

    CONSTRAINT "bilans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation" ADD CONSTRAINT "operation_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation" ADD CONSTRAINT "operation_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "paiements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation" ADD CONSTRAINT "operation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilans" ADD CONSTRAINT "bilans_vagueId_fkey" FOREIGN KEY ("vagueId") REFERENCES "vagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilans" ADD CONSTRAINT "bilans_generePar_fkey" FOREIGN KEY ("generePar") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
