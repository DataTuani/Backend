/*
  Warnings:

  - You are about to drop the column `observaciones` on the `consulta` table. All the data in the column will be lost.
  - You are about to drop the column `receta` on the `consulta` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `consulta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."consulta" DROP COLUMN "observaciones",
DROP COLUMN "receta",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sintomas" TEXT,
ADD COLUMN     "tratamiento" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
