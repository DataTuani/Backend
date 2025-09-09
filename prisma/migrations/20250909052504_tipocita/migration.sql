-- AlterTable
ALTER TABLE "public"."cita" ADD COLUMN     "tipo_id" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "public"."tipo_cita" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,

    CONSTRAINT "tipo_cita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipo_cita_tipo_key" ON "public"."tipo_cita"("tipo");

-- AddForeignKey
ALTER TABLE "public"."cita" ADD CONSTRAINT "cita_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "public"."tipo_cita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
