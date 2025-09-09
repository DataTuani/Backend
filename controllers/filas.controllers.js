const { PrismaClient } = require("@prisma/client");
const generarFolio = require("../utils/generarFolio");
const validarBloqueDisponible = require("../utils/validarBloque");
const prisma = new PrismaClient();

const unirseFila = async (req, res) => {
  const { paciente_id, hospital_id } = req.body;

  try {
    const existePacienteEnFila = await prisma.filaVirtual.findFirst({
      where: { paciente_id, estado_id: 5 },
    });
    if (existePacienteEnFila) {
      return res
        .status(400)
        .json({ error: "El paciente ya está en la fila virtual" });
    }

    const ultimoTurno = await prisma.filaVirtual.findFirst({
      where: { hospital_id },
      orderBy: { numero_turno: "desc" },
    });

    const numero_turno = ultimoTurno ? ultimoTurno.numero_turno + 1 : 1;
    // Hora estimada
    const ahora = new Date();
    const hora_estimacion = new Date(
      ahora.getTime() + (numero_turno - 1) * 20 * 60000
    );

    const nuevoTurno = await prisma.filaVirtual.create({
      data: {
        paciente_id,
        hospital_id,
        numero_turno,
        estado_id: 5,
        hora_asignacion: ahora,
        hora_estimacion,
      },
      include: {
        paciente: { include: { usuario: true } },
        hospital: true,
        estado: true,
      },
    });

    return res.status(201).json({
      message: "Te has unido a la fila virtual",
      turno: nuevoTurno,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al unirse a la fila" });
  }
};

const estadoFilaPaciente = async (req, res) => {
  const { hospital_id, paciente_id } = req.query;
  const pacienteIdNum = parseInt(paciente_id, 10);
  const hospitalIdNum = parseInt(hospital_id, 10);

  try {
    // turno actual en el hospital
    const turnoActual = await prisma.filaVirtual.findFirst({
      where: { hospital_id: hospitalIdNum, estado_id: 5 },
      orderBy: { numero_turno: "asc" },
    });
    // turno del paciente
    const turnoPaciente = await prisma.filaVirtual.findFirst({
      where: {
        hospital_id: hospitalIdNum,
        paciente_id: pacienteIdNum,
        estado_id: 5,
      },
      orderBy: { numero_turno: "asc" },
    });

    if (!turnoPaciente) {
      return res.json({
        message: "El paciente no tiene un turno en espera en este hospital",
      });
    }

    return res.status(200).json({
      turno_actual: turnoActual ? turnoActual.numero_turno : null,
      turnoPaciente: turnoPaciente ? turnoPaciente.numero_turno : null,
      hora_estimacion: turnoPaciente ? turnoPaciente.hora_estimacion : null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al consultar fila" });
  }
};

const estadoFilaHospital = async (req, res) => {
  const { hospital_id } = req.query;
  const hospitalIdNum = parseInt(hospital_id, 10);

  try {
    // Obtener todos los turnos en espera de ese hospital
    const turnosEnFila = await prisma.filaVirtual.findMany({
      where: { hospital_id: hospitalIdNum, estado_id: 5 },
      orderBy: { numero_turno: "asc" },
      include: {
        paciente: {
          include: { usuario: true },
        },
      },
    });

    if (turnosEnFila.length === 0) {
      return res.json({
        message: "No hay turnos en espera en este hospital",
        turnos: [],
      });
    }

    return res.status(200).json({
      total: turnosEnFila.length,
      turnos: turnosEnFila.map((t) => ({
        numero_turno: t.numero_turno,
        paciente: t.paciente,
        hora_estimacion: t.hora_estimacion,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al consultar fila" });
  }
};

const avanzarFila = async (req, res) => {
  const { hospital_id } = req.params;
  const hospitalIdInt = parseInt(hospital_id, 10);
  const DURACION_TURNO_MIN = 20;

  try {
    const turnoActual = await prisma.filaVirtual.findFirst({
      where: { hospital_id: hospitalIdInt, estado_id: 7 },
      orderBy: { numero_turno: "asc" },
    });

    if (turnoActual) {
      await prisma.filaVirtual.update({
        where: { id: turnoActual.id },
        data: { estado_id: 6 },
      });
    }

    const siguiente = await prisma.filaVirtual.findFirst({
      where: { hospital_id: hospitalIdInt, estado_id: 5 },
      orderBy: { numero_turno: "asc" },
    });

    if (siguiente) {
      const actualizado = await prisma.filaVirtual.update({
        where: { id: siguiente.id },
        data: { estado_id: 7, hora_estimacion: new Date() },
      });
      nuevaCita = await crearCitaDesdeFila(
        actualizado.paciente_id,
        hospitalIdInt
      );
    }

    const siguientes = await prisma.filaVirtual.findMany({
      where: { hospital_id: hospitalIdInt, estado_id: 5 },
      orderBy: { numero_turno: "asc" },
    });

    let acumulador = 1;
    for (const turno of siguientes) {
      const nuevaHora = new Date(
        new Date().getTime() + acumulador * DURACION_TURNO_MIN * 60000
      );

      await prisma.filaVirtual.update({
        where: { id: turno.id },
        data: { hora_estimacion: nuevaHora },
      });
      acumulador++;
    }

    return res
      .status(200)
      .json({ message: "Fila actualizada", nuevacita: nuevaCita });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al avanzar fila" });
  }
};

const cancelarTurno = async (req, res) => {
  const { turno_id } = req.params;

  try {
    const turno = await prisma.filaVirtual.findUnique({
      where: { id: parseInt(turno_id, 10) },
    });

    if (!turno || turno.estado_id !== 5) {
      return res
        .status(400)
        .json({ error: "El turno no existe o no está en espera" });
    }

    await prisma.filaVirtual.update({
      where: { id: turno.id },
      data: { estado_id: 2 },
    });

    return res.status(200).json({ message: "Turno cancelado correctamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al cancelar turno" });
  }
};

const crearCitaDesdeFila = async (
  paciente_id,
  hospital_id,
  motivo_consulta = "Consulta general"
) => {
  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id: paciente_id },
    });
    if (!paciente) throw new Error("Paciente no encontrado");

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospital_id },
    });
    if (!hospital) throw new Error("Hospital no encontrado");

    let expediente = await prisma.expediente.findFirst({
      where: { paciente_id },
    });

    if (!expediente) {
      const ultimoExpediente = await prisma.expediente.findFirst({
        where: { hospital_id },
        orderBy: { id: "desc" },
      });

      let ultimoConsecutivo = 0;
      if (ultimoExpediente && ultimoExpediente.folio) {
        const partes = ultimoExpediente.folio.split("-");
        ultimoConsecutivo = parseInt(partes[partes.length - 1], 10);
      }

      const nuevoFolio = generarFolio(hospital.codigo, ultimoConsecutivo);
      expediente = await prisma.expediente.create({
        data: {
          paciente_id,
          hospital_id,
          fecha_apertura: new Date(),
          observaciones: null,
          folio: nuevoFolio,
        },
      });
    }

    const ahora = new Date();
    const diaSemana = ahora.getDay();

    const turnosDisponibles = await prisma.turno.findMany({
      where: { hospital_id, dia_semana: diaSemana },
      include: { medico: true },
    });

    const medicosValidos = [];
    for (const turno of turnosDisponibles) {
      const inicioMs = new Date(turno.hora_inicio).getTime();
      const finMs = new Date(turno.hora_fin).getTime();
      const ahoraMs = ahora.getTime();

      if (ahoraMs >= inicioMs && ahoraMs <= finMs) {
        medicosValidos.push(turno.medico);
      }
    }

    if (medicosValidos.length === 0) {
      throw new Error("No hay médicos disponibles en este momento");
    }

    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const medicosConCitas = await Promise.all(
      medicosValidos.map(async (medico) => {
        const count = await prisma.cita.count({
          where: {
            medico_id: medico.id,
            fecha_hora: { gte: hoyInicio, lte: hoyFin },
          },
        });
        return { medico, count };
      })
    );

    medicosConCitas.sort((a, b) => a.count - b.count);
    const medicoAsignado = medicosConCitas[0].medico;

    const nuevaCita = await prisma.cita.create({
      data: {
        paciente: { connect: { id: paciente_id } },
        medico: { connect: { id: medicoAsignado.id } },
        hospital: { connect: { id: hospital_id } },
        estado: { connect: { id: 1 } },
        expediente: { connect: { id: expediente.id } },
        fecha_hora: ahora,
        motivo_consulta,
      },
      include: {
        paciente: { include: { usuario: true } },
        medico: { include: { usuario: true } },
        hospital: true,
        estado: true,
        expediente: true,
      },
    });

    return nuevaCita;
  } catch (error) {
    console.error("Error creando cita desde fila:", error.message);
    throw error;
  }
};

module.exports = {
  unirseFila,
  estadoFilaPaciente,
  avanzarFila,
  cancelarTurno,
  estadoFilaHospital,
};
