const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const agregarTurnoMedico = async (req, res) => {
  const { medico_id, hospital_id, hora_inicio, hora_fin } = req.body;
  try {
    const turnoExistente = await prisma.turno.findFirst({
      where: {
        medico_id: medico_id,
        hospital_id: hospital_id,
        hora_inicio: { lte: new Date(hora_fin) },
        hora_fin: { gte: new Date(hora_inicio) },
      },
    });

    if (turnoExistente) {
      return res.status(400).json({
        success: false,
        message: "Turno ya existe en ese horario",
        turnoExistente,
      });
    }

    const nuevoTurno = await prisma.turno.create({
      data: {
        medico_id,
        hospital_id,
        hora_inicio: new Date(hora_inicio),
        hora_fin: new Date(hora_fin),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Turno creado exitosamente",
      nuevoTurno,
    });
  } catch (error) {
    console.error(error);
    console.error("❌ Error agregando turno:", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
};

const turnosHospital = async (req, res) => {
  const { hospital_id } = req.query;
  try {
    const turnosHospital = await prisma.turno.findMany({
      where: {
        hospital_id: hospital_id,
      },
      include: {
        medico: {
          select: {
            usuario: {
              select: {
                primer_nombre: true,
                segundo_nombre: true,
                primer_apellido: true,
                segundo_apellido: true,
                cedula: true,
              },
            },
          },
        },
        hospital: true,
      },
    });

    if (!turnosHospital) {
      res.status(400).json({
        success: false,
        message: "No hay turnos para este hospital",
        turnoExistente,
      });
    }

    return res.status(200).json({
      success: true,
      turnosHospital,
    });
  } catch (error) {
    console.error(error);
    console.error("❌ Error obteniendo los turnos:", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
};

module.exports = {
  agregarTurnoMedico,
  turnosHospital,
};
