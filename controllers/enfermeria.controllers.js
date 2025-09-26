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

    // Hora de Nicaragua (UTC-6)
    const utcOffset = -6;
    const hoyManagua = new Date(hoy.getTime() + utcOffset * 60 * 60 * 1000);

    const inicioDiaUTC = new Date(hoyManagua);
    inicioDiaUTC.setHours(0, 0, 0, 0);

    const finDiaUTC = new Date(hoyManagua);
    finDiaUTC.setHours(23, 59, 59, 999);

    const turnos = await prisma.turno.findMany({
      where: {
        hospital_id: Number(hospital_id),
        hora_inicio: { lte: finDiaUTC },
        hora_fin: { gte: inicioDiaUTC },
      },
    });

    const citas = await prisma.cita.findMany({
      where: {
        hospital_id: Number(hospital_id),
        fecha_hora: { gte: inicioDiaUTC, lte: finDiaUTC },
      },
      select: { fecha_hora: true },
    });

    // Convertimos las citas a minutos desde medianoche para comparación
    const citasOcupadas = new Set(
      citas.map((cita) => {
        const fecha = new Date(cita.fecha_hora);
        fecha.setHours(fecha.getHours() - utcOffset); // Ajustar a hora local
        return fecha.getHours() * 60 + fecha.getMinutes();
      })
    );

    const disponibles = new Set();

    for (const turno of turnos) {
      let inicio = new Date(turno.hora_inicio);
      let fin = new Date(turno.hora_fin);

      // Ajuste al día actual
      if (inicio < inicioDiaUTC) inicio = new Date(inicioDiaUTC);
      if (fin > finDiaUTC) fin = new Date(finDiaUTC);

      while (inicio <= fin) {
        const minutos = inicio.getHours() * 60 + inicio.getMinutes();
        if (!citasOcupadas.has(minutos)) {
          disponibles.add(minutos);
        }
        inicio = new Date(inicio.getTime() + 20 * 60000);
      }
    }

    // Ordenar y convertir a formato AM/PM limpio
    const horarios = Array.from(disponibles)
      .sort((a, b) => a - b)
      .map((minutos) => {
        let h = Math.floor(minutos / 60);
        let m = minutos % 60;
        const ampm = h >= 12 ? "PM" : "AM";
        if (h === 0) h = 12;
        if (h > 12) h -= 12;
        return `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")} ${ampm}`;
      });

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
  turnos_disponibles,
};
