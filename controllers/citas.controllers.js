const { PrismaClient } = require("@prisma/client");
const generarFolio = require("../utils/generarFolio");
const validarBloqueDisponible = require("../utils/validarBloque");
const e = require("express");
const prisma = new PrismaClient();

const agendarCita = async (req, res) => {
  const { paciente_id, hospital_id, fecha_hora, motivo_consulta } = req.body;

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id: paciente_id },
    });
    if (!paciente)
      return res.status(404).json({ error: "Paciente no encontrado" });

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospital_id },
    });
    if (!hospital)
      return res.status(404).json({ error: "Hospital no encontrado" });

    const fecha = new Date(fecha_hora);
    const diaSemana = fecha.getDay();

    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const citaExistente = await prisma.cita.findFirst({
      where: {
        paciente_id,
        fecha_hora: {
          gte: inicioDia,
          lte: finDia,
        },
      },
    });

    if (citaExistente) {
      return res.status(400).json({
        error: "El paciente ya tiene una cita programada para este día",
      });
    }

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

    const turnosDisponibles = await prisma.turno.findMany({
      where: { hospital_id, dia_semana: diaSemana },
      include: { medico: true },
    });

    const medicosValidos = [];
    for (const turno of turnosDisponibles) {
      const inicioMs = new Date(turno.hora_inicio).getTime();
      const finMs = new Date(turno.hora_fin).getTime();
      const fechaMs = fecha.getTime();

      if (fechaMs >= inicioMs && fechaMs <= finMs) {
        const bloqueLibre = await validarBloqueDisponible(
          fecha,
          turno.medico_id
        );
        if (bloqueLibre) medicosValidos.push(turno.medico);
      }
    }

    if (medicosValidos.length === 0) {
      return res.status(400).json({
        error: "No hay médicos disponibles en el bloque seleccionado",
      });
    }

    const medicosConCitas = await Promise.all(
      medicosValidos.map(async (medico) => {
        const count = await prisma.cita.count({
          where: {
            medico_id: medico.id,
            fecha_hora: {
              gte: inicioDia,
              lte: finDia,
            },
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
        fecha_hora: fecha,
        motivo_consulta,
      },
      include: {
        paciente: {
          include: {
            usuario: {
              select: {
                primer_nombre: true,
                segundo_nombre: true,
                primer_apellido: true,
                segundo_apellido: true,
                cedula: true,
                telefono: true,
              },
            },
          },
        },
        medico: {
          include: {
            especialidad: true,
            usuario: {
              select: {
                primer_nombre: true,
                segundo_nombre: true,
                primer_apellido: true,
                segundo_apellido: true,
                cedula: true,
                telefono: true,
              },
            },
          },
        },
        hospital: true,
        estado: true,
        expediente: true,
      },
    });

    return res
      .status(201)
      .json({ message: "Cita agendada exitosamente", expediente, nuevaCita });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerCitasPorHospital = async (req, res) => {
  const hospital_id = Number(req.query.hospital_id);

  if (isNaN(hospital_id)) {
    return res.status(400).json({ error: "Hospital inválido" });
  }

  try {
    const citas = await prisma.cita.findMany({
      where: { hospital_id },
      include: {
        paciente: { include: { usuario: true } },
        medico: { include: { usuario: true } },
        hospital: true,
        estado: true,
        expediente: true,
      },
    });

    if (citas.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron citas para este hospital" });
    }

    return res.status(200).json({ citas });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerCitasPorPaciente = async (req, res) => {
  const paciente_id = Number(req.query.paciente_id);

  if (isNaN(paciente_id)) {
    return res.status(400).json({ error: "Paciente inválido" });
  }

  try {
    const citas = await prisma.cita.findMany({
      where: { paciente_id },
      include: {
        paciente: { include: { usuario: true } },
        medico: { include: { usuario: true } },
        hospital: true,
        estado: true,
        expediente: true,
      },
    });

    if (citas.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron citas para este paciente" });
    }

    return res.status(200).json({ citas });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerCitasPorDoctor = async (req, res) => {
  const personal_id = Number(req.query.personal_id);

  if (isNaN(personal_id)) {
    return res.status(400).json({ error: "Personal inválido" });
  }

  try {
    const citas = await prisma.cita.findMany({
      where: { medico_id: personal_id },
      include: {
        paciente: { include: { usuario: true } },
        medico: { include: { usuario: true } },
        hospital: true,
        estado: true,
        expediente: true,
      },
    });

    if (citas.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron citas de este doctor" });
    }

    return res.status(200).json({ citas });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerCitaPorId = async (req, res) => {
  const cita_id = Number(req.query.id);

  if (isNaN(cita_id)) {
    return res.status(400).json({ error: "Cita inválida" });
  }

  try {
    const cita = await prisma.cita.findUnique({
      where: { id: cita_id },
      include: {
        paciente: { include: { usuario: true } },
        medico: { include: { usuario: true } },
        hospital: true,
        estado: true,
        expediente: true,
      },
    });

    if (!cita) {
      return res.status(404).json({ message: "No se encontro la cita" });
    }

    return res.status(200).json({ cita });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const cancelarCita = async (req, res) => {
  const cita_id = Number(req.params.id);

  if (isNaN(cita_id)) {
    return res.status(400).json({ error: "Cita inválida" });
  }

  try {
    const cita = await prisma.cita.update({
      where: { id: cita_id },
      data: {
        estado_id: 2, //Cancelada
      },
    });

    return res.status(200).json({
      message: "Cita cancelada correctamente",
      cita,
    });
  } catch (error) {
    console.error(error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
const reprogramarCita = async (req, res) => {
  const cita_id = Number(req.params.id);
  const { fecha_hora } = req.body;

  try {
    const citaExistente = await prisma.cita.findUnique({
      where: { id: cita_id },
      include: { hospital: true },
    });

    if (!citaExistente) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    const hospital_id = citaExistente.hospital_id;
    const paciente_id = citaExistente.paciente_id;

    const fechaCita = new Date(fecha_hora);

    const inicioDia = new Date(fechaCita);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fechaCita);
    finDia.setHours(23, 59, 59, 999);
    const diaSemana = fechaCita.getDay();

    const citaOtroDia = await prisma.cita.findFirst({
      where: {
        paciente_id,
        fecha_hora: { gte: inicioDia, lte: finDia },
        NOT: { id: cita_id },
      },
    });

    if (citaOtroDia) {
      return res.status(400).json({
        error: "El paciente ya tiene otra cita programada para este día",
      });
    }

    const turnosDia = await prisma.turno.findMany({
      where: { hospital_id, dia_semana: diaSemana },
      include: { medico: true },
    });

    const turnosValidos = turnosDia.filter((t) => {
      const inicioMs = new Date(t.hora_inicio).getTime();
      const finMs = new Date(t.hora_fin).getTime();
      return fechaCita.getTime() >= inicioMs && fechaCita.getTime() <= finMs;
    });

    if (turnosValidos.length === 0) {
      return res
        .status(400)
        .json({ error: "No hay turnos disponibles en esa fecha" });
    }

    const medicosDisponibles = [];
    for (const t of turnosValidos) {
      const citaMismoHorario = await prisma.cita.findFirst({
        where: {
          medico_id: t.medico_id,
          fecha_hora: fechaCita,
          NOT: { id: cita_id },
        },
      });
      if (!citaMismoHorario) medicosDisponibles.push(t);
    }

    if (medicosDisponibles.length === 0) {
      return res
        .status(400)
        .json({ error: "Todos los médicos tienen otra cita a esa hora" });
    }

    const medicosConCitas = await Promise.all(
      medicosDisponibles.map(async (t) => {
        const count = await prisma.cita.count({
          where: {
            medico_id: t.medico_id,
            fecha_hora: { gte: inicioDia, lte: finDia },
            NOT: { id: cita_id },
          },
        });
        return { medico: t.medico, count };
      })
    );

    medicosConCitas.sort((a, b) => a.count - b.count);
    const medicoDisponible = medicosConCitas[0]?.medico;

    if (!medicoDisponible) {
      return res
        .status(400)
        .json({ error: "No hay médicos disponibles en esa fecha" });
    }

    const citaReprogramada = await prisma.cita.update({
      where: { id: cita_id },
      data: {
        fecha_hora: fechaCita,
        medico_id: medicoDisponible.id,
        estado_id: 8, // estado reprogramada
      },
      include: {
        paciente: { include: { usuario: true } },
        medico: { include: { usuario: true } },
        hospital: true,
        estado: true,
      },
    });

    return res.status(200).json({
      message: "Cita reprogramada con éxito",
      cita: citaReprogramada,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const atenderCita = async (req, res) => {
  const { cita_id } = req.params;
  const { sintomas, diagnostico, tratamiento, medicamentos, ordenes } =
    req.body;

  try {
    const cita = await prisma.cita.findUnique({
      where: { id: parseInt(cita_id, 10) },
      include: { expediente: true },
    });

    if (!cita) return res.status(404).json({ error: "Cita no encontrada" });

    const consulta = await prisma.consulta.upsert({
      where: { cita_id: cita.id },
      update: {
        sintomas,
        diagnostico,
        tratamiento,
        receta: {
          deleteMany: {},
          create: medicamentos?.map((m) => ({
            nombre: m.nombre,
            dosis: m.dosis,
            frecuencia: m.frecuencia,
            duracion: m.duracion,
            instrucciones: m.instrucciones,
          })),
        },
        ordenes: {
          deleteMany: {},
          create: ordenes?.map((o) => ({
            tipo_examen: o.tipo_examen,
            instrucciones: o.instrucciones,
            estado_id: 1,
          })),
        },
      },
      create: {
        cita_id: cita.id,
        expediente_id: cita.expediente_id,
        sintomas,
        diagnostico,
        tratamiento,
        receta: {
          create: medicamentos?.map((m) => ({
            nombre: m.nombre,
            dosis: m.dosis,
            frecuencia: m.frecuencia,
            duracion: m.duracion,
            instrucciones: m.instrucciones,
          })),
        },
        ordenes: {
          create: ordenes?.map((o) => ({
            tipo_examen: o.tipo_examen,
            instrucciones: o.instrucciones,
            estado_id: 1,
          })),
        },
      },
      include: {
        receta: true,
        ordenes: {
          include: { estado: true }, // aquí solo true
        },
      },
    });

    await prisma.cita.update({
      where: { id: cita.id },
      data: { estado_id: 6 },
    });

    return res.status(201).json({
      message: "Consulta guardada exitosamente",
      consulta,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al guardar consulta" });
  }
};

module.exports = {
  agendarCita,
  obtenerCitasPorHospital,
  obtenerCitasPorPaciente,
  obtenerCitaPorId,
  cancelarCita,
  reprogramarCita,
  obtenerCitasPorDoctor,
  atenderCita,
};
