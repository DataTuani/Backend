-- CreateTable
CREATE TABLE "public"."usuario" (
    "id" SERIAL NOT NULL,
    "primer_nombre" TEXT NOT NULL,
    "segundo_nombre" TEXT NOT NULL,
    "primer_apellido" TEXT NOT NULL,
    "segundo_apellido" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3) NOT NULL,
    "genero" TEXT NOT NULL,
    "telefono" TEXT,
    "correo" TEXT NOT NULL,
    "contraseña" TEXT NOT NULL,
    "direccion" TEXT,
    "cedula" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rol_id" INTEGER NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rol" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."paciente" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "grupo_sanguineo" TEXT,

    CONSTRAINT "paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."personal" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "especialidad_id" INTEGER NOT NULL,

    CONSTRAINT "personal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hospital" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,

    CONSTRAINT "hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."especialidad" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "especialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cita" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "medico_id" INTEGER NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "expediente_id" INTEGER,
    "motivo_consulta" TEXT,

    CONSTRAINT "cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."estado" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "estado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consulta" (
    "id" SERIAL NOT NULL,
    "cita_id" INTEGER,
    "expediente_id" INTEGER NOT NULL,
    "diagnostico" TEXT,
    "observaciones" TEXT,
    "receta" TEXT,

    CONSTRAINT "consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expediente" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "folio" TEXT,
    "fecha_apertura" TIMESTAMP(3) NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "responsable" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "expediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."signos_vitales" (
    "id" SERIAL NOT NULL,
    "consulta_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "signos_vitales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."resultado_laboratorio" (
    "id" SERIAL NOT NULL,
    "expediente_id" INTEGER NOT NULL,
    "consulta_id" INTEGER NOT NULL,
    "tipo_examen" TEXT NOT NULL,
    "archivo_url" TEXT,
    "fecha_resultado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resultado_laboratorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."enfermedad_cronica" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "enfermedad_cronica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alergia" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "alergia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notificacion" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fila_virtual" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "numero_turno" INTEGER NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "hora_asignacion" TIMESTAMP(3) NOT NULL,
    "hora_estimacion" TIMESTAMP(3),

    CONSTRAINT "fila_virtual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "public"."usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_cedula_key" ON "public"."usuario"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "public"."rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "paciente_usuario_id_key" ON "public"."paciente"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "personal_usuario_id_key" ON "public"."personal"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "consulta_cita_id_key" ON "public"."consulta"("cita_id");

-- AddForeignKey
ALTER TABLE "public"."usuario" ADD CONSTRAINT "usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "public"."rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."paciente" ADD CONSTRAINT "paciente_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."personal" ADD CONSTRAINT "personal_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."personal" ADD CONSTRAINT "personal_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."personal" ADD CONSTRAINT "personal_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "public"."especialidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cita" ADD CONSTRAINT "cita_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "public"."paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cita" ADD CONSTRAINT "cita_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "public"."personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cita" ADD CONSTRAINT "cita_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cita" ADD CONSTRAINT "cita_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "public"."estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cita" ADD CONSTRAINT "cita_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "public"."expediente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consulta" ADD CONSTRAINT "consulta_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "public"."cita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consulta" ADD CONSTRAINT "consulta_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "public"."expediente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expediente" ADD CONSTRAINT "expediente_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "public"."paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expediente" ADD CONSTRAINT "expediente_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expediente" ADD CONSTRAINT "expediente_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "public"."estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."signos_vitales" ADD CONSTRAINT "signos_vitales_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "public"."consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resultado_laboratorio" ADD CONSTRAINT "resultado_laboratorio_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "public"."expediente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resultado_laboratorio" ADD CONSTRAINT "resultado_laboratorio_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "public"."consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enfermedad_cronica" ADD CONSTRAINT "enfermedad_cronica_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "public"."paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alergia" ADD CONSTRAINT "alergia_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "public"."paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notificacion" ADD CONSTRAINT "notificacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fila_virtual" ADD CONSTRAINT "fila_virtual_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "public"."paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fila_virtual" ADD CONSTRAINT "fila_virtual_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fila_virtual" ADD CONSTRAINT "fila_virtual_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "public"."estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
