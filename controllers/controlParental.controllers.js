const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

// HIJO SOLICITA EL OTP
 const generarOTP = async (req, res) => {
  try {
    const { usuario_id } = req.body;
    const codigo = crypto.randomInt(100000, 999999).toString(); 
    const expiracion = new Date(Date.now() + 10 * 60 * 1000);

    // Guardar OTP
    await prisma.controlParentalOTP.create({
      data: {
        codigo,
        usuario_id,
        expiracion,
      },
    });

    res.json({
      succes: true,
      codigo,
      message: "Código OTP generado correctamente.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al generar OTP." });
  }
};


 const validarOTP = async (req, res) => {
  try {
    const { codigo, usuario_hijo_id } = req.body;

    const otp = await prisma.controlParentalOTP.findUnique({
      where: { codigo },
      include: { usuario: true }, 
    });

    if (!otp) return res.status(400).json({ error: "Código no válido." });
    if (otp.usado) return res.status(400).json({ error: "Código ya usado." });
    if (otp.expiracion < new Date()) return res.status(400).json({ error: "Código expirado." });

    await prisma.controlParentalOTP.update({
      where: { id: otp.id },
      data: { usado: true },
    });

    const enlace = await prisma.enlaceParental.upsert({
      where: {
        padre_id_hijo_id: {
          padre_id: otp.usuario.id,
          hijo_id: usuario_hijo_id,
        },
      },
      update: {},
      create: {
        padre_id: otp.usuario.id,
        hijo_id: usuario_hijo_id,
      },
    });

    const tokenPadre = jwt.sign(
      {
        id: otp.usuario.id,
        correo: otp.usuario.correo,
        rol_id: otp.usuario.rol_id,
        modo: "control_parental",
        hijo_id: usuario_hijo_id, 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      mensaje: "Enlace parental creado exitosamente.",
      enlace,
      usuarioPadreid: otp.usuario.id,
      usuarioPadreNombre: otp.usuario.primer_nombre,
      usuarioPadreApellido: otp.usuario.primer_apellido,
      usuarioPadreCorreo: otp.usuario.correo,
      tokenPadre,
    });
  } catch (error) {
    console.error("Error en validarOTP:", error);
    res.status(500).json({ error: "Error al validar el código OTP." });
  }
};

module.exports = {
generarOTP,
validarOTP
};