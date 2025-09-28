const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const obtenerExpedientePorUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    const expedienteUser = await prisma.expediente.findUnique({
      where: { paciente_id: Number(user_id) },
      select: {
        paciente_id: true,
        folio: true,
        fecha_apertura: true,
        observaciones: true,
        hospital: {
          select: {
            nombre: true,
            direccion: true,
            email: true,
            telefono: true,
          },
        },
        paciente: {
          select: {
            id: true,
            usuario: {
              select: {
                primer_nombre: true,
                segundo_nombre: true,
                primer_apellido: true,
                segundo_apellido: true,
                cedula: true,
                telefono: true,
                correo: true,
                fecha_nacimiento: true,
                genero: true,
                direccion: true,
              },
            },
            grupo_sanguineo: true,
            alergias: {
              select: {
                descripcion: true,
              },
            },
            enfermedades: {
              select: {
                descripcion: true,
              },
            },
            citas: {
              select: {
                fecha_hora: true,
                motivo_consulta: true,
                estado: { select: { nombre: true } },
                tipo: { select: { tipo: true } },
                consulta: {
                  select: {
                    diagnostico: true,
                    sintomas: true,
                    tratamiento: true,
                    receta: {
                      select: {
                        nombre: true,
                        dosis: true,
                        duracion: true,
                        frecuencia: true,
                        instrucciones: true,
                      },
                    },
                    ordenes: {
                      select: {
                        tipo_examen: true,
                        instrucciones: true,
                        estado: {
                          select: { nombre: true },
                        },
                      },
                    },
                  },
                },
                medico: {
                  select: {
                    usuario: {
                      select: {
                        primer_nombre: true,
                        segundo_nombre: true,
                        primer_apellido: true,
                        segundo_apellido: true,
                        cedula: true,
                        fecha_nacimiento: true,
                        genero: true,
                      },
                    },
                    especialidad: {
                      select: {
                        nombre: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!expedienteUser) {
      return res
        .status(404)
        .json({ error: "Expediente no encontrado para este usuario" });
    }

    return res.status(200).json({
      success: true,
      Expediente: expedienteUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const editarExpediente = async (req, res) => {
  const { user_id } = req.params;
  const {
    telefono,
    direccion,
    correo,
    alergias,
    enfermedades_cronicas,
    observaciones,
  } = req.body;

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { usuario_id: parseInt(user_id, 10) },
      include: {
        expediente: true,
        usuario: true,
      },
    });

    if (!paciente || !paciente.expediente) {
      return res
        .status(404)
        .json({ success: false, error: "Expediente no encontrado" });
    }

    const updateUsuarioData = {};
    if (telefono) updateUsuarioData.telefono = telefono;
    if (direccion) updateUsuarioData.direccion = direccion;
    if (correo) updateUsuarioData.correo = correo;

    if (Object.keys(updateUsuarioData).length > 0) {
      await prisma.usuario.update({
        where: { id: paciente.usuario_id },
        data: updateUsuarioData,
      });
    }

    if (observaciones !== undefined) {
      await prisma.expediente.update({
        where: { id: paciente.expediente.id },
        data: { observaciones },
      });
    }

    if (alergias) {
      await prisma.alergia.deleteMany({
        where: { paciente_id: paciente.id },
      });

      await prisma.alergia.createMany({
        data: alergias.map((descripcion) => ({
          descripcion,
          paciente_id: paciente.id,
        })),
      });
    }

    if (enfermedades_cronicas) {
      await prisma.enfermedadCronica.deleteMany({
        where: { paciente_id: paciente.id },
      });

      await prisma.enfermedadCronica.createMany({
        data: enfermedades_cronicas.map((descripcion) => ({
          descripcion,
          paciente_id: paciente.id,
        })),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expediente actualizado correctamente",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "Error al actualizar expediente",
    });
  }
};

module.exports = {
  obtenerExpedientePorUser,
  editarExpediente,
};
