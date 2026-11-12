-- AlterTable
ALTER TABLE "Gasto" ADD COLUMN     "propinaCentavos" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RecordatorioCobro" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "acreedorId" TEXT NOT NULL,
    "deudorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordatorioCobro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecordatorioCobro_grupoId_acreedorId_deudorId_createdAt_idx" ON "RecordatorioCobro"("grupoId", "acreedorId", "deudorId", "createdAt");

-- AddForeignKey
ALTER TABLE "RecordatorioCobro" ADD CONSTRAINT "RecordatorioCobro_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordatorioCobro" ADD CONSTRAINT "RecordatorioCobro_acreedorId_fkey" FOREIGN KEY ("acreedorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordatorioCobro" ADD CONSTRAINT "RecordatorioCobro_deudorId_fkey" FOREIGN KEY ("deudorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

