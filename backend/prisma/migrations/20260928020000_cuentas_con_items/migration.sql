-- AlterEnum
ALTER TYPE "TipoDivision" ADD VALUE 'items';

-- AlterTable
ALTER TABLE "Grupo" ADD COLUMN     "esRapida" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LineaGasto" (
    "id" TEXT NOT NULL,
    "gastoId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitarioCentavos" INTEGER NOT NULL,
    "compartido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LineaGasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsignacionLinea" (
    "id" TEXT NOT NULL,
    "lineaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "AsignacionLinea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LineaGasto_gastoId_idx" ON "LineaGasto"("gastoId");

-- CreateIndex
CREATE INDEX "AsignacionLinea_usuarioId_idx" ON "AsignacionLinea"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "AsignacionLinea_lineaId_usuarioId_key" ON "AsignacionLinea"("lineaId", "usuarioId");

-- AddForeignKey
ALTER TABLE "LineaGasto" ADD CONSTRAINT "LineaGasto_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "Gasto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionLinea" ADD CONSTRAINT "AsignacionLinea_lineaId_fkey" FOREIGN KEY ("lineaId") REFERENCES "LineaGasto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionLinea" ADD CONSTRAINT "AsignacionLinea_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

