const { PrismaClient } = require("@prisma/client");
const generarFolio = require("../utils/generarFolio");
const validarBloqueDisponible = require("../utils/validarBloque");
const e = require("express");
const { supabase } = require("../utils/supabase");
const prisma = new PrismaClient();
const path = require("path");

const agendarCita = async (req, res) => {
  const { paciente_id, hospital_id, fecha_hora, motivo_consulta, tipoCita } =
    req.body;

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id: paciente_id },
    });
    if (!paciente)
      return res
        .status(404)
        .json({ success: false, error: "Paciente no encontrado" });

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospital_id },
    });
    if (!hospital)
      return res
        .status(404)
        .json({ success: false, error: "Hospital no encontrado" });

    const fecha = new Date(fecha_hora);

    console.log("fecha_hora");
    console.log(fecha);

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
        success: false,
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
      where: {
        hospital_id,
        hora_inicio: {
          lte: fecha,
        },
        hora_fin: {
          gte: fecha,
        },
      },
      include: { medico: true },
    });

    const medicosValidos = [];
    for (const turno of turnosDisponibles) {
      const inicioMs = new Date(turno.hora_inicio).getTime();
      const finMs = new Date(turno.hora_fin).getTime();
      const fechaMs = fecha.getTime();

      console.log("Inicio turno (UTC):", new Date(inicioMs).toISOString());
      console.log("Fin turno (UTC):", new Date(finMs).toISOString());
      console.log("Fecha cita (UTC):", new Date(fechaMs).toISOString());

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
        success: false,
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

    let roomId = "";
    if (tipoCita == 2 || tipoCita == 4) {
      roomId = `cita_${Date.now()}_${paciente_id}_${medicoAsignado.id}`;
    }

    const ultimoTurno = await prisma.cita.findFirst({
      where: {
        medico_id: medicoAsignado.id,
        fecha_hora: {
          gte: inicioDia,
          lte: finDia,
        },
      },
      orderBy: {
        numero_turno: "desc",
      },
      select: {
        numero_turno: true,
      },
    });

    const nuevoTurno = ultimoTurno ? ultimoTurno.numero_turno + 1 : 1;
    let motivoConsultaImage = null;
    if (req.file) {
      const fileExt = path.extname(req.file.originalname);
      const fileName = `motivoconsulta_${paciente_id}_${fecha_hora}${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("Motivo-Consulta")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        return res
          .status(500)
          .json({ success: false, error: "Error al subir imagen" });
      }

      const { data } = supabase.storage
        .from("Motivo-Consulta")
        .getPublicUrl(fileName);

      motivoConsultaImage = data.publicUrl;
    }

    const nuevaCita = await prisma.cita.create({
      data: {
        roomId,
        paciente: { connect: { id: paciente_id } },
        medico: { connect: { id: medicoAsignado.id } },
        hospital: { connect: { id: hospital_id } },
        estado: { connect: { id: 1 } },

        expediente: { connect: { id: expediente.id } },
        fecha_hora: fecha,
        motivo_consulta,

        tipo: { connect: { id: tipoCita } },
        numero_turno: nuevoTurno,
        imagen_url: motivoConsultaImage,
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
        tipo: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Cita agendada exitosamente",
      expediente,
      nuevaCita,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

const obtenerCitasPorHospital = async (req, res) => {
  const hospital_id = Number(req.query.hospital_id);

  if (isNaN(hospital_id)) {
    return res.status(400).json({ success: false, error: "Hospital inválido" });
  }

  try {
    const citas = await prisma.cita.findMany({
      where: { hospital_id: parseInt(hospital_id) },
      select: {
        id: true,
        roomId: true,
        tipo: {select: {tipo: true}},

        motivo_consulta: true,
        imagen_url: true,
        fecha_hora: true,
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
                especialidad: {select: {nombre: true}}

          },
        },
        estado: { select: { nombre: true } },
        expediente: { select: { folio: true } },
      },
    });

    if (citas.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No se encontraron citas para este hospital",
      });
    }

    return res.status(200).json({ success: true, citas });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

const obtenerCitasPorPaciente = async (req, res) => {
  const paciente_id = Number(req.query.paciente_id);

  if (isNaN(paciente_id)) {
    return res.status(400).json({ success: false, error: "Paciente inválido" });
  }

  try {
    const citas = await prisma.cita.findMany({
      where: { paciente_id },
       select: {
        id: true,
        numero_turno: true,
        tipo: {select: {tipo: true}},
        roomId: true,
        motivo_consulta: true,
        imagen_url: true,
        fecha_hora: true,
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
                especialidad: {select: {nombre: true}}

          },
        },
        hospital: {
          select: {
            nombre: true,
          }
        },
        estado: { select: { nombre: true } },
        expediente: { select: { folio: true } },
      },
    });

    if (citas.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No se encontraron citas para este paciente",
      });
    }

    return res.status(200).json({ success: true, citas });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

const obtenerCitasPorDoctor = async (req, res) => {
  const personal_id = Number(req.query.personal_id);

  if (isNaN(personal_id)) {
    return res.status(400).json({ success: false, error: "Personal inválido" });
  }

  try {
    const citas = await prisma.cita.findMany({
      where: { medico_id: personal_id },
      select: {
        id: true,
        numero_turno: true,
        roomId: true,
        tipo: {select: {tipo: true}},

        motivo_consulta: true,
        imagen_url: true,
        fecha_hora: true,
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
                especialidad: {select: {nombre: true}}

          },
        },
        hospital: {
          select: {
            nombre: true,
          }
        },
        estado: { select: { nombre: true } },
        expediente: { select: { folio: true } },
      },
    });

    if (citas.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No se encontraron citas de este doctor",
      });
    }

    return res.status(200).json({ success: true, citas });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

const obtenerCitaPorId = async (req, res) => {
  const { cita_id } = req.params;

  if (isNaN(cita_id)) {
    return res.status(400).json({ success: false, error: "Cita inválida" });
  }

  try {
    const cita = await prisma.cita.findUnique({
      where: { id: parseInt(cita_id) },
       select: {
        id: true,
        numero_turno: true,
        roomId: true,
        tipo: {select: {tipo: true}},

        motivo_consulta: true,
        imagen_url: true,
        fecha_hora: true,
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
                especialidad: {select: {nombre: true}}

          },
        },
        hospital: {
          select: {
            nombre: true,
          }
        },
        estado: { select: { nombre: true } },
        expediente: { select: { folio: true } },
      },
    });

    if (!cita) {
      return res
        .status(404)
        .json({ success: false, error: "No se encontro la cita" });
    }

    const fechaLocal = new Date(cita.fecha_hora).toLocaleString("es-NI", {
      timeZone: "America/Managua",
    });

    return res.status(200).json({
      cita: {
        ...cita,
        fecha_hora: fechaLocal,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

const obtenerConsultaPorId = async (req, res) => {
  const { cita_id } = req.params;

  if (isNaN(cita_id)) {
    return res.status(400).json({ success: false, error: "Cita inválida" });
  }

  try {
    const consulta = await prisma.consulta.findUnique({
      where: { cita_id: parseInt(cita_id) },
      select: {
        expediente_id: true,
        diagnostico: true,
        sintomas: true,
        tratamiento: true,
        created_at: true,
        cita: {
          select: {
            numero_turno: true,
            motivo_consulta: true,
            imagen_url: true,

            expediente: { select: { folio: true } },
            tipo: { select: { tipo: true } },
            estado: { select: { nombre: true } },
            medico: {
              select: {
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
                especialidad: {select: {nombre: true}}
              },
            },
            paciente: {
              select: {
                usuario: {
                  select: {
                    primer_nombre: true,
                    segundo_nombre: true,
                    primer_apellido: true,
                    segundo_apellido: true,
                    cedula: true,
                    telefono: true,
                    fecha_nacimiento: true,
                  },
                },
              },
            },
          },
        },
        receta: {
          select: {
            nombre: true,
            dosis: true,
            frecuencia: true,
            duracion: true,
            instrucciones: true,
          },
        },
        ordenes: {
          select: {
            tipo_examen: true,
            instrucciones: true,
            created_at: true,
            estado: { select: { nombre: true } },
          },
        },
      },
    });

    if (!consulta) {
      return res
        .status(404)
        .json({ success: false, error: "No se encontro la consulta" });
    }

    return res.status(200).json({ success: true, consulta });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

const cancelarCita = async (req, res) => {
  const cita_id = Number(req.params.id);

  if (isNaN(cita_id)) {
    return res.status(400).json({ success: false, error: "Cita inválida" });
  }

  try {
    const cita = await prisma.cita.update({
      where: { id: cita_id },
      data: {
        estado_id: 2, //Cancelada
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cita cancelada correctamente",
      cita,
    });
  } catch (error) {
    console.error(error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, error: "Cita no encontrada" });
    }

    return res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
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
      return res
        .status(404)
        .json({ success: false, error: "Cita no encontrada" });
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
        success: false,
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
      return res.status(400).json({
        success: false,
        error: "No hay turnos disponibles en esa fecha",
      });
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
      return res.status(400).json({
        success: false,
        error: "Todos los médicos tienen otra cita a esa hora",
      });
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
      return res.status(400).json({
        success: false,
        error: "No hay médicos disponibles en esa fecha",
      });
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
      success: true,
      message: "Cita reprogramada con éxito",
      cita: citaReprogramada,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
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

    if (!cita)
      return res
        .status(404)
        .json({ success: false, error: "Cita no encontrada" });

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
            estado: { connect: { id: 1 } }, // ✅ aquí
            expediente: { connect: { id: cita.expediente_id } },
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
            estado: { connect: { id: 1 } },
            expediente: { connect: { id: cita.expediente_id } },
          })),
        },
      },
      include: {
        receta: true,
        ordenes: {
          include: { estado: true },
        },
      },
    });

    await prisma.cita.update({
      where: { id: cita.id },
      data: { estado_id: 6 },
    });

    const fechaBase = new Date(cita.fecha_hora);
    const inicioDelDia = new Date(fechaBase.setHours(0, 0, 0, 0));
    const finDelDia = new Date(fechaBase.setHours(23, 59, 59, 999));

    const siguiente = await prisma.cita.findFirst({
      where: {
        estado_id: { not: 6 },
        numero_turno: {
          gt: cita.numero_turno,
        },
        fecha_hora: {
          gte: inicioDelDia,
          lte: finDelDia,
        },
      },
      orderBy: { numero_turno: "asc" },
    });

    if (siguiente) {
      await prisma.cita.update({
        where: { id: siguiente.id },
        data: { estado_id: 5 },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Consulta guardada exitosamente",
      consulta,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Error al guardar consulta" });
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
  obtenerConsultaPorId,
};
