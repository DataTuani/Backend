-- CreateTable
CREATE TABLE "public"."control_parental_otp" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "expiracion" TIMESTAMP(3) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_parental_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."enlace_parental" (
    "id" SERIAL NOT NULL,
    "padre_id" INTEGER NOT NULL,
    "hijo_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enlace_parental_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "control_parental_otp_codigo_key" ON "public"."control_parental_otp"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "enlace_parental_padre_id_hijo_id_key" ON "public"."enlace_parental"("padre_id", "hijo_id");

-- AddForeignKey
ALTER TABLE "public"."control_parental_otp" ADD CONSTRAINT "control_parental_otp_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enlace_parental" ADD CONSTRAINT "enlace_parental_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enlace_parental" ADD CONSTRAINT "enlace_parental_hijo_id_fkey" FOREIGN KEY ("hijo_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
