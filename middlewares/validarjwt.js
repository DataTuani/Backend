const { response } = require("express");
const jwt = require("jsonwebtoken");

const validarJWT = (req, res = response, next) => {
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

    req.uid = id;
    req.name = correo;
  } catch (error) {
    return res.status(401).json({  // <-- Aquí estaba el error
      ok: false,
      msg: "Token no válido",
    });
  }

  next();
};

module.exports = {
  validarJWT,
};
