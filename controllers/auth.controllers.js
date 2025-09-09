const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const {
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    correo,
    password,
    genero,
    telefono,
    cedula,
    fecha_nacimiento,
    direccion,
    rol_id,
    grupo_sanguineo,
    alergias = [],
    enfermedades_cronicas = [],
  } = req.body;

  try {
    const existeCedula = await prisma.usuario.findUnique({ where: { cedula } });
    if (existeCedula) {
      return res.status(400).json({ error: "La cédula ya está en uso" });
    }

    const existeCorreo = await prisma.usuario.findUnique({ where: { correo } });
    if (existeCorreo) {
      return res.status(400).json({ error: "El correo ya está en uso" });
    }

    const rol = await prisma.rol.findUnique({
      where: { id: rol_id },
    });

    if (!rol) {
      return res.status(400).json({ error: "Rol no encontrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        correo,
        contraseña: hashedPassword,
        genero,
        telefono,
        cedula,
        fecha_nacimiento: new Date(fecha_nacimiento),
        direccion,
        rol_id: rol.id,
        Paciente: {
          create: {
            grupo_sanguineo,
            alergias: {
              create: alergias.map((alergia) => ({ descripcion: alergia })),
            },
            enfermedades: {
              create: enfermedades_cronicas.map((enfermedad) => ({
                descripcion: enfermedad,
              })),
            },
          },
        },
      },
      include: {
        Paciente: { include: { alergias: true, enfermedades: true } },
      },
    });
    const { contraseña, ...usuarioSinContraseña } = nuevoUsuario;

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      usuario: usuarioSinContraseña,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const login = async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { correo },
      select: {
        id: true, 
        primer_nombre: true,
        segundo_nombre: true,
        primer_apellido: true,
        segundo_apellido: true,
        correo: true,
        contraseña: true, 
        Paciente: {
          include: {
            alergias: true,
            enfermedades: true,
          },
        },
      },
    });

    if (!usuario) {
      return res
        .status(400)
        .json({ error: "No existe un usuario con ese correo" });
    }

    const passwordMatch = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Correo o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const { contraseña: _, ...usuarioSinContraseña } = usuario;

    return res.status(201).json({
      message: "Login exitoso",
      usuario: usuarioSinContraseña,
      token,
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
