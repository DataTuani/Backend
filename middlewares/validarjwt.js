const { response } = require("express");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient()

const validarJWT = async (req, res = response, next) => {
  // x-token headers
  const token = req.header("x-token");

  if (!token) {
    return res.status(401).json({
      ok: false,
      msg: "No hay token en la petición",
    });
  }

  try {
    const { id, correo } = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await prisma.usuario.findUnique({
      where: {id: id},
      include: {rol: true}
    })

    req.id = id;
    req.name = correo;
    req.rol = usuario.rol.nombre
  } catch (error) {
    console.log(error);
    
    return res.status(401).json({
      ok: false,
      msg: "Token no válido",
    });
  }

  next();
};

module.exports = {
  validarJWT,
};
