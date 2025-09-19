const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

cron.schedule("*/5 * * * *", async () => {
  
  console.log("⏰ VERIFICANDO CITAS");

  const ahora = new Date();

  

  try {
    const dosHorasDespues = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);

    const citas = await prisma.cita.findMany({
      where: {
        fecha_hora: {
          gte: ahora,
          lte: dosHorasDespues,
        },
        estado_id: 1,
      },
      include: {
        paciente: {
          include: {
            usuario: true,
          },
        },
      },
    });

    for (const cita of citas) {
      const usuario = cita.paciente.usuario;
      const horaCita = cita.fecha_hora;

      const horaFormateada = horaCita.toLocaleTimeString("es-NI", {
        timeZone: "America/Managua",
      });

      const notiInicio = new Date(horaCita.getTime() - 2 * 60 * 60 * 1000);

      const diffMinutos = Math.floor((ahora - notiInicio) / (30 * 60 * 1000));

      const nextNotiTime = new Date(
        notiInicio.getTime() + diffMinutos * 30 * 60 * 1000
      );

      const existeNotificacion = await prisma.notificacion.findFirst({
        where: {
          usuario_id: usuario.id,
          titulo: "Recordatorio de cita",
          fecha: nextNotiTime,
        },
      });

      if (
        !existeNotificacion &&
        ahora >= nextNotiTime &&
        nextNotiTime <= horaCita
      ) {
        await prisma.notificacion.create({
          data: {
            usuario_id: usuario.id,
            titulo: "Recordatorio de cita",
            mensaje: `Tienes una cita programada hoy a las ${horaFormateada}`,
            fecha: nextNotiTime,
          },
        });

        console.log(
          `🔔 Notificación creada para ${usuario.primer_nombre} (${
            usuario.correo
          }) a las ${nextNotiTime.toLocaleTimeString("es-NI", {
            timeZone: "America/Managua",
          })}`
        );
      }
    }

    if (citas.length === 0) {
      console.log("✅ No hay citas pendientes en las próximas 2 horas");
    }
  } catch (error) {
    console.error("❌ Error verificando citas:", error);
  }
});

cron.schedule("*/15 * * * * ", async () => {
  console.log("VERIFICANDO CITAS CONFIRMADAS");

  try {
    const citas = await prisma.cita.findMany({
      where: {
        estado_id: 3,
      },
      include: {
        paciente: {
          include: {
            usuario: {
              select: {
                id: true,
                primer_nombre: true,
                segundo_nombre: true,
                primer_apellido: true,
                segundo_apellido: true,
              },
            },
          },
        },
      },
    });

    for (const cita of citas) {
      const usuario = cita.paciente.usuario;

      const existeNotificacion = await prisma.notificacion.findFirst({
        where: {
          usuario_id: usuario.id,
          titulo: "Cita confirmada",
          cita_id: cita.id,
        },
      });


      if (!existeNotificacion) {
        await prisma.notificacion.create({
          data: {
            usuario_id: usuario.id,
            titulo: "Cita confirmada",
            mensaje: `Tu cita programada para el ${cita.fecha_hora.toLocaleString(
              "es-NI",
              {
                timeZone: "America/Managua",
              }
            )} ha sido confirmada.`,
            fecha: cita.fecha_hora,
            cita_id: cita.id,
          },
        });

        console.log(
          `🔔 Notificación de confirmación enviada a ${usuario.primer_nombre} (${usuario.correo})`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error verificando citas:", error);
  }
});

cron.schedule("*/15 * * * * ", async () => {
  console.log("VERIFICANDO CITAS CANCELADAS");

  try {
    const citas = await prisma.cita.findMany({
      where: {
        estado_id: 2,
      },
      include: {
        paciente: {
          include: {
            usuario: {
              select: {
                id: true,
                primer_nombre: true,
                segundo_nombre: true,
                primer_apellido: true,
                segundo_apellido: true,
              },
            },
          },
        },
      },
    });

    for (const cita of citas) {
      const usuario = cita.paciente.usuario;

      const existeNotificacion = await prisma.notificacion.findFirst({
        where: {
          usuario_id: usuario.id,
          titulo: "Cita cancelada",
          cita_id: cita.id,
        },
      });

      if (!existeNotificacion) {
        await prisma.notificacion.create({
          data: {
            usuario_id: usuario.id,
            titulo: "Cita cancelada",
            mensaje: `Tu cita programada para el ${cita.fecha_hora.toLocaleString(
              "es-NI",
              {
                timeZone: "America/Managua",
              }
            )} ha sido cancelada.`,
            fecha: cita.fecha_hora,

            cita_id: cita.id,
          },
        });

        console.log(
          `🔔 Notificación de cancelacion enviada a ${usuario.primer_nombre} (${usuario.correo})`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error verificando citas:", error);
  }
});
