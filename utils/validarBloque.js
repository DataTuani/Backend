// Recibe fecha y hora de la cita, id del médico y hospital
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const validarBloqueDisponible = async (fecha_hora, medico_id, cita_id = null) => {
  const fecha = new Date(fecha_hora);
    console.log(fecha);
    

  const minutos = fecha.getMinutes();
  const bloque = Math.floor(minutos / 20) * 20;
  fecha.setMinutes(bloque, 0, 0);

  const inicioBloque = new Date(fecha);
  const finBloque = new Date(fecha);
  finBloque.setMinutes(finBloque.getMinutes() + 19, 59, 999);

const citaExistente = await prisma.cita.findFirst({
  where: {
    medico_id,
    fecha_hora: { gte: inicioBloque, lte: finBloque },
    ...(cita_id ? { NOT: { id: cita_id } } : {}), 
  },
});


  return !citaExistente;
};

module.exports = validarBloqueDisponible;
