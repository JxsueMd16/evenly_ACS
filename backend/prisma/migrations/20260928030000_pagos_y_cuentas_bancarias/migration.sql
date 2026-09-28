-- CreateEnum
CREATE TYPE "PreferenciaPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'AMBOS');

-- CreateEnum
CREATE TYPE "TipoCuentaBancaria" AS ENUM ('MONETARIA', 'AHORRO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'RECHAZADO');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "preferenciaPago" "PreferenciaPago" NOT NULL DEFAULT 'AMBOS';

-- CreateTable
CREATE TABLE "CuentaBancaria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "tipo" "TipoCuentaBancaria" NOT NULL,
    "numero" TEXT NOT NULL,
    "titular" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuentaBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "deudorId" TEXT NOT NULL,
    "acreedorId" TEXT NOT NULL,
    "montoCentavos" INTEGER NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "nota" TEXT,
    "evidencia" BYTEA,
    "evidenciaTipo" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondidoAt" TIMESTAMP(3),

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CuentaBancaria_usuarioId_idx" ON "CuentaBancaria"("usuarioId");

-- CreateIndex
CREATE INDEX "Pago_grupoId_estado_idx" ON "Pago"("grupoId", "estado");

-- CreateIndex
CREATE INDEX "Pago_acreedorId_estado_idx" ON "Pago"("acreedorId", "estado");

-- AddForeignKey
ALTER TABLE "CuentaBancaria" ADD CONSTRAINT "CuentaBancaria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_deudorId_fkey" FOREIGN KEY ("deudorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_acreedorId_fkey" FOREIGN KEY ("acreedorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

