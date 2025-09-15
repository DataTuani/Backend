/*
  Warnings:

  - You are about to drop the `resultado_laboratorio` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `expediente_id` to the `orden_laboratorio` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."resultado_laboratorio" DROP CONSTRAINT "resultado_laboratorio_consulta_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."resultado_laboratorio" DROP CONSTRAINT "resultado_laboratorio_expediente_id_fkey";

-- AlterTable
ALTER TABLE "public"."orden_laboratorio" ADD COLUMN     "expediente_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."resultado_laboratorio";

-- AddForeignKey
ALTER TABLE "public"."orden_laboratorio" ADD CONSTRAINT "orden_laboratorio_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "public"."expediente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
