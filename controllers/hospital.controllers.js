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

const registrarHospital = async (req, res) => {
  const { nombre, direccion, telefono, email, codigo } = req.body;

  try {
    const hospitales = await prisma.hospital.findUnique({
      where: { codigo: codigo },
    });

    if (hospitales) {
      res.status(400).json({
        success: false,
        error: "El código de hospital ya está en uso",
      });
    }
    const hospital = await prisma.hospital.create({
      data: { nombre, direccion, telefono, email, codigo },
    });

    return res.status(200).json({
      success: true,
      message: "Hospital registrado exitosamente",
      hospital,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Error al crear el hospital" });
  }
};

module.exports = {
  hospitales,
  registrarHospital,
};
