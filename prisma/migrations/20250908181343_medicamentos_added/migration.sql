-- CreateTable
CREATE TABLE "public"."medicamento_recetado" (
    "id" SERIAL NOT NULL,
    "consulta_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "dosis" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL,
    "duracion" TEXT NOT NULL,
    "instrucciones" TEXT,

    CONSTRAINT "medicamento_recetado_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."medicamento_recetado" ADD CONSTRAINT "medicamento_recetado_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "public"."consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
