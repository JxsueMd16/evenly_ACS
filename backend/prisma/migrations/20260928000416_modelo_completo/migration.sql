/*
  Warnings:

  - Added the required column `passwordHash` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('grupo', 'comida', 'amigos', 'transporte', 'entretenimiento');

-- CreateEnum
CREATE TYPE "ColorTema" AS ENUM ('ice', 'sky', 'pink');

-- CreateEnum
CREATE TYPE "RolMiembro" AS ENUM ('ADMIN', 'MIEMBRO');

-- CreateEnum
CREATE TYPE "TipoDivision" AS ENUM ('equal', 'itemized');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "avatarColor" "ColorTema" NOT NULL DEFAULT 'sky',
ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Grupo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL DEFAULT 'grupo',
    "tema" "ColorTema" NOT NULL DEFAULT 'sky',
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiembroGrupo" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rol" "RolMiembro" NOT NULL DEFAULT 'MIEMBRO',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiembroGrupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "montoCentavos" INTEGER NOT NULL,
    "categoria" "Categoria" NOT NULL DEFAULT 'grupo',
    "tipoDivision" "TipoDivision" NOT NULL DEFAULT 'equal',
    "pagadoPorId" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemGasto" (
    "id" TEXT NOT NULL,
    "gastoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "montoCentavos" INTEGER NOT NULL,

    CONSTRAINT "ItemGasto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Grupo_creadoPorId_idx" ON "Grupo"("creadoPorId");

-- CreateIndex
CREATE INDEX "MiembroGrupo_usuarioId_idx" ON "MiembroGrupo"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "MiembroGrupo_grupoId_usuarioId_key" ON "MiembroGrupo"("grupoId", "usuarioId");

-- CreateIndex
CREATE INDEX "Gasto_grupoId_createdAt_idx" ON "Gasto"("grupoId", "createdAt");

-- CreateIndex
CREATE INDEX "Gasto_pagadoPorId_idx" ON "Gasto"("pagadoPorId");

-- CreateIndex
CREATE INDEX "ItemGasto_usuarioId_idx" ON "ItemGasto"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemGasto_gastoId_usuarioId_key" ON "ItemGasto"("gastoId", "usuarioId");

-- AddForeignKey
ALTER TABLE "Grupo" ADD CONSTRAINT "Grupo_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroGrupo" ADD CONSTRAINT "MiembroGrupo_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroGrupo" ADD CONSTRAINT "MiembroGrupo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_pagadoPorId_fkey" FOREIGN KEY ("pagadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemGasto" ADD CONSTRAINT "ItemGasto_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "Gasto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemGasto" ADD CONSTRAINT "ItemGasto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
