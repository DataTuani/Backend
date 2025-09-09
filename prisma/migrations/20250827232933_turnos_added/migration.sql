/*
  Warnings:

  - You are about to drop the column `estado_id` on the `expediente` table. All the data in the column will be lost.
  - You are about to drop the column `responsable` on the `expediente` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paciente_id]` on the table `expediente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codigo]` on the table `hospital` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."expediente" DROP CONSTRAINT "expediente_estado_id_fkey";

-- AlterTable
ALTER TABLE "public"."expediente" DROP COLUMN "estado_id",
DROP COLUMN "responsable",
ALTER COLUMN "fecha_apertura" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."hospital" ADD COLUMN     "codigo" TEXT NOT NULL DEFAULT 'DEFAULT-CODIGO';

-- CreateTable
CREATE TABLE "public"."Turno" (
    "id" SERIAL NOT NULL,
    "medico_id" INTEGER NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TIMESTAMP(3) NOT NULL,
    "hora_fin" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expediente_paciente_id_key" ON "public"."expediente"("paciente_id");

-- CreateIndex
CREATE UNIQUE INDEX "hospital_codigo_key" ON "public"."hospital"("codigo");

-- AddForeignKey
ALTER TABLE "public"."Turno" ADD CONSTRAINT "Turno_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "public"."personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Turno" ADD CONSTRAINT "Turno_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
