-- CreateEnum
CREATE TYPE "EstadoAmistad" AS ENUM ('PENDIENTE', 'ACEPTADA');

-- AlterTable
ALTER TABLE "Grupo" ADD COLUMN     "codigoInvitacion" TEXT;

-- CreateTable
CREATE TABLE "Amistad" (
    "id" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "estado" "EstadoAmistad" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "Amistad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Amistad_destinatarioId_estado_idx" ON "Amistad"("destinatarioId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Amistad_solicitanteId_destinatarioId_key" ON "Amistad"("solicitanteId", "destinatarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Grupo_codigoInvitacion_key" ON "Grupo"("codigoInvitacion");

-- AddForeignKey
ALTER TABLE "Amistad" ADD CONSTRAINT "Amistad_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amistad" ADD CONSTRAINT "Amistad_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

