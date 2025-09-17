const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const hospitales = async (req, res) => {
  try {
    const hospitales = await prisma.hospital.findMany({
      select: {
        id: true,
        nombre: true,
        direccion: true,
        codigo: true,
        email: true,
        telefono: true,
      },
    });

    return res.status(200).json({
      success: true,
      hospitales,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Error al consultar hospitales" });
  }
};

module.exports = {
  hospitales,
};
