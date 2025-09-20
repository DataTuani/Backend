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

const turnos_disponibles = async (req, res) => {
  const { hospital_id } = req.query;

  try {
    const hoy = new Date();
    const inicioDia = new Date(hoy);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(hoy);
    finDia.setHours(23, 59, 59, 999);

    console.log("inicioDia:", inicioDia);
    console.log("finDia:", finDia);

    // Turnos disponibles que cruzan el día consultado
    const turnos = await prisma.turno.findMany({
      where: {
        hospital_id: Number(hospital_id),
        hora_inicio: { lte: finDia },
        hora_fin: { gte: inicioDia }, // 👈 ojo: así traes turnos que abarcan el día
      },
    });

    console.log("turnos:", turnos);

    // Citas agendadas en ese día
    const citas = await prisma.cita.findMany({
      where: {
        hospital_id: Number(hospital_id),
        fecha_hora: {
          gte: inicioDia,
          lte: finDia,
        },
      },
      select: { fecha_hora: true },
    });

    const citasOcupadas = citas.map((cita) =>
      cita.fecha_hora.toISOString().substring(11, 16)
    );

    const disponibles = [];

    for (const turno of turnos) {
      let inicio = new Date(turno.hora_inicio);
      let fin = new Date(turno.hora_fin);

      // 🔹 Aseguramos que el inicio no sea antes del día actual
      if (inicio < inicioDia) inicio = new Date(inicioDia);
      // 🔹 Aseguramos que el fin no sea después del día actual
      if (fin > finDia) fin = new Date(finDia);

      while (inicio < fin) {
        const hora = inicio.toISOString().substring(11, 16); // "HH:mm"
        if (!citasOcupadas.includes(hora)) {
          disponibles.push(hora);
        }
        inicio = new Date(inicio.getTime() + 20 * 60000); // +20 minutos
      }
    }

    const horarios = [...new Set(disponibles)].sort();
    return res.status(200).json({ success: true, horarios });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error obteniendo turnos disponibles",
      error,
    });
  }
};


module.exports = {
  agregarTurnoMedico,
  turnosHospital,
  turnos_disponibles
};
