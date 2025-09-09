-- CreateTable
CREATE TABLE "public"."orden_laboratorio" (
    "id" SERIAL NOT NULL,
    "consulta_id" INTEGER NOT NULL,
    "tipo_examen" TEXT NOT NULL,
    "instrucciones" TEXT,
    "estado_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orden_laboratorio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."orden_laboratorio" ADD CONSTRAINT "orden_laboratorio_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "public"."consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orden_laboratorio" ADD CONSTRAINT "orden_laboratorio_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "public"."estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
