const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const obtenerExpedientePorUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    const expedienteUser = await prisma.expediente.findUnique({
      where: { paciente_id: Number(user_id) },
    });
    
    if (existeCedula) {
      return res.status(400).json({ error: "La cédula ya está en uso" });
    }

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      usuario: usuarioSinContraseña,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  register,
  login,
};
