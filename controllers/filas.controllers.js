const { PrismaClient } = require("@prisma/client");
const generarFolio = require("../utils/generarFolio");
const validarBloqueDisponible = require("../utils/validarBloque");
const prisma = new PrismaClient();

// const unirseFila = async (req, res) => {
//   const { paciente_id, hospital_id } = req.body;

//   try {
//     const existePacienteEnFila = await prisma.filaVirtual.findFirst({
//       where: { paciente_id, estado_id: 5 },
//     });
//     if (existePacienteEnFila) {
//       return res.status(400).json({
//         success: false,
//         error: "El paciente ya está en la fila virtual",
//       });
//     }

//     const ultimoTurno = await prisma.filaVirtual.findFirst({
//       where: { hospital_id },
//       orderBy: { numero_turno: "desc" },
//     });

//     const numero_turno = ultimoTurno ? ultimoTurno.numero_turno + 1 : 1;
//     // Hora estimada
//     const ahora = new Date();
//     const hora_estimacion = new Date(
//       ahora.getTime() + (numero_turno - 1) * 20 * 60000
//     );

//     const nuevoTurno = await prisma.filaVirtual.create({
//       data: {
//         paciente_id,
//         hospital_id,
//         numero_turno,
//         estado_id: 5,
//         hora_asignacion: ahora,
//         hora_estimacion,
//       },
//       include: {
//         paciente: { include: { usuario: true } },
//         hospital: true,
//         estado: true,
//       },
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Te has unido a la fila virtual",
//       turno: nuevoTurno,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ success: false, error: "Error al unirse a la fila" });
//   }
// };

const estadoFilaPaciente = async (req, res) => {
  const { hospital_id, paciente_id } = req.params;
  const hospitalIdNum = parseInt(hospital_id, 10);
  const pacienteIdNum = parseInt(paciente_id, 10);

  try {
    // 🔹 Rango de hoy (00:00:00 a 23:59:59)
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    // 🔹 Obtener todos los turnos en espera hoy (ordenados por número)
    const turnosHoy = await prisma.cita.findMany({
      where: {
        hospital_id: hospitalIdNum,
        estado_id: 1, // 1 = en espera
        fecha_hora: { gte: inicioDia, lte: finDia },
      },
      orderBy: { numero_turno: "asc" },
      select: {
        id: true,
        numero_turno: true,
        paciente_id: true,
        hospital: {
          select: {
            id: true,
            nombre: true,
           
          },
        },
        medico: {
          select: {
            id: true,
            usuario: {
              select: {
                primer_nombre: true,
                segundo_nombre: true,
                primer_apellido: true,
                segundo_apellido: true,
                correo: true,
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
    });

    // 🔹 Buscar el turno del paciente
    const turnoPaciente = turnosHoy.find(
      (t) => t.paciente_id === pacienteIdNum
    );

    if (!turnoPaciente) {
      return res.status(404).json({
        success: false,
        message: "El paciente no tiene turno asignado hoy en este hospital.",
      });
    }

    // 🔹 Calcular posición y cantidad de personas delante
    const posicion =
      turnosHoy.findIndex((t) => t.paciente_id === pacienteIdNum) + 1;
    const personasDelante = posicion - 1;

    // 🔹 Turno actual (primero de la lista)
    const turnoActual = turnosHoy.length > 0 ? turnosHoy[0] : null;

    // 🔹 Datos del hospital y médico del paciente
    const hospital = turnoPaciente.hospital;
    const medico = turnoPaciente.medico;

    return res.status(200).json({
      success: true,
      data: {
        posicion,
        personasDelante,
        totalEnFila: turnosHoy.length,
        // turnoActual,
        // turnoPaciente,
        hospital,
        medico,
      },
    });
  } catch (error) {
    console.error("Error en estadoFilaPaciente:", error);
    return res.status(500).json({
      success: false,
      error: "Error al consultar la fila del paciente.",
    });
  }
};


const estadoFilaHospital = async (req, res) => {
  const { hospital_id } = req.query;
  const hospitalIdNum = parseInt(hospital_id, 10);

  try {
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    const turnoFila = await prisma.cita.findFirst({
      where: {
        hospital_id: hospitalIdNum,
        estado_id: 1,
        fecha_hora: {
          gte: inicioDia,
          lte: finDia,
        },
      },
      orderBy: { numero_turno: "asc" },
      select: {
        numero_turno: true,
        estado: { select: { nombre: true } },
        motivo_consulta: true,
        fecha_hora: true,
        tipo: { select: { tipo: true } },
        paciente: {
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
      },
    });

    if (turnoFila.length === 0) {
      return res.json({
        success: false,
        error: "No hay turno en espera en este hospital",
        turnos: [],
      });
    }

    return res.status(200).json({
      success: true,
      turnoFila,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Error al consultar fila" });
  }
};

// const avanzarFila = async (req, res) => {
//   const { hospital_id } = req.params;
//   const hospitalIdInt = parseInt(hospital_id, 10);
//   const DURACION_TURNO_MIN = 20;

//   try {
//     const turnoActual = await prisma.filaVirtual.findFirst({
//       where: { hospital_id: hospitalIdInt, estado_id: 7 },
//       orderBy: { numero_turno: "asc" },
//     });

//     if (turnoActual) {
//       await prisma.filaVirtual.update({
//         where: { id: turnoActual.id },
//         data: { estado_id: 6 },
//       });
//     }

//     const siguiente = await prisma.filaVirtual.findFirst({
//       where: { hospital_id: hospitalIdInt, estado_id: 5 },
//       orderBy: { numero_turno: "asc" },
//     });

//     if (siguiente) {
//       const actualizado = await prisma.filaVirtual.update({
//         where: { id: siguiente.id },
//         data: { estado_id: 7, hora_estimacion: new Date() },
//       });
//       nuevaCita = await crearCitaDesdeFila(
//         actualizado.paciente_id,
//         hospitalIdInt
//       );
//     }

//     const siguientes = await prisma.filaVirtual.findMany({
//       where: { hospital_id: hospitalIdInt, estado_id: 5 },
//       orderBy: { numero_turno: "asc" },
//     });

//     let acumulador = 1;
//     for (const turno of siguientes) {
//       const nuevaHora = new Date(
//         new Date().getTime() + acumulador * DURACION_TURNO_MIN * 60000
//       );

//       await prisma.filaVirtual.update({
//         where: { id: turno.id },
//         data: { hora_estimacion: nuevaHora },
//       });
//       acumulador++;
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Fila actualizada",
//       nuevacita: nuevaCita,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ success: false, error: "Error al avanzar fila" });
//   }
// };

// const cancelarTurno = async (req, res) => {
//   const { turno_id } = req.params;

//   try {
//     const turno = await prisma.filaVirtual.findUnique({
//       where: { id: parseInt(turno_id, 10) },
//     });

//     if (!turno || turno.estado_id !== 5) {
//       return res.status(400).json({
//         success: false,
//         error: "El turno no existe o no está en espera",
//       });
//     }

//     await prisma.filaVirtual.update({
//       where: { id: turno.id },
//       data: { estado_id: 2 },
//     });

//     return res
//       .status(200)
//       .json({ success: true, message: "Turno cancelado correctamente" });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ success: false, error: "Error al cancelar turno" });
//   }
// };

// const crearCitaDesdeFila = async (
//   paciente_id,
//   hospital_id,
//   motivo_consulta = "Consulta general"
// ) => {
//   try {
//     const paciente = await prisma.paciente.findUnique({
//       where: { id: paciente_id },
//     });
//     if (!paciente)
//       return res
//         .status(404)
//         .json({ success: false, error: "Paciente no encontrado" });

//     const hospital = await prisma.hospital.findUnique({
//       where: { id: hospital_id },
//     });
//     if (!hospital)
//       return res
//         .status(404)
//         .json({ success: false, error: "Hospital no encontrado" });

//     let expediente = await prisma.expediente.findFirst({
//       where: { paciente_id },
//     });

//     if (!expediente) {
//       const ultimoExpediente = await prisma.expediente.findFirst({
//         where: { hospital_id },
//         orderBy: { id: "desc" },
//       });

//       let ultimoConsecutivo = 0;
//       if (ultimoExpediente && ultimoExpediente.folio) {
//         const partes = ultimoExpediente.folio.split("-");
//         ultimoConsecutivo = parseInt(partes[partes.length - 1], 10);
//       }

//       const nuevoFolio = generarFolio(hospital.codigo, ultimoConsecutivo);
//       expediente = await prisma.expediente.create({
//         data: {
//           paciente_id,
//           hospital_id,
//           fecha_apertura: new Date(),
//           observaciones: null,
//           folio: nuevoFolio,
//         },
//       });
//     }

//     const ahora = new Date();
//     const diaSemana = ahora.getDay();

//     const turnosDisponibles = await prisma.turno.findMany({
//       where: { hospital_id, dia_semana: diaSemana },
//       include: { medico: true },
//     });

//     const medicosValidos = [];
//     for (const turno of turnosDisponibles) {
//       const inicioMs = new Date(turno.hora_inicio).getTime();
//       const finMs = new Date(turno.hora_fin).getTime();
//       const ahoraMs = ahora.getTime();

//       if (ahoraMs >= inicioMs && ahoraMs <= finMs) {
//         medicosValidos.push(turno.medico);
//       }
//     }

//     if (medicosValidos.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No hay médicos disponibles en este momento",
//       });
//     }

//     const hoyInicio = new Date();
//     hoyInicio.setHours(0, 0, 0, 0);

//     const hoyFin = new Date();
//     hoyFin.setHours(23, 59, 59, 999);

//     const medicosConCitas = await Promise.all(
//       medicosValidos.map(async (medico) => {
//         const count = await prisma.cita.count({
//           where: {
//             medico_id: medico.id,
//             fecha_hora: { gte: hoyInicio, lte: hoyFin },
//           },
//         });
//         return { medico, count };
//       })
//     );

//     medicosConCitas.sort((a, b) => a.count - b.count);
//     const medicoAsignado = medicosConCitas[0].medico;

//     const nuevaCita = await prisma.cita.create({
//       data: {
//         paciente: { connect: { id: paciente_id } },
//         medico: { connect: { id: medicoAsignado.id } },
//         hospital: { connect: { id: hospital_id } },
//         estado: { connect: { id: 1 } },
//         expediente: { connect: { id: expediente.id } },
//         fecha_hora: ahora,
//         motivo_consulta,
//       },
//       include: {
//         paciente: { include: { usuario: true } },
//         medico: { include: { usuario: true } },
//         hospital: true,
//         estado: true,
//         expediente: true,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       nuevaCita,
//     });
//   } catch (error) {
//     console.error("Error creando cita desde fila:", error.message);
//     return res.status(404).json({
//       success: false,
//       error: "Error creando cita desde fila",
//     });
//   }
// };

module.exports = {
  // unirseFila,
  estadoFilaPaciente,
  // avanzarFila,
  // cancelarTurno,
  estadoFilaHospital,
};
