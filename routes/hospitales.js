const express = require("express");
const router = express.Router();
const { body, validationResult, query, param } = require("express-validator");

const hospitalesController = require("../controllers/hospital.controllers");

const validate = require("../middlewares/validate");
const { validarJWT } = require("../middlewares/validarjwt");

router.get("/", validarJWT, hospitalesController.hospitales);

router.post(
  "/registrar",
  validarJWT,
  [
    body("nombre").isString().withMessage("Nombre inválida"),
    body("direccion").isString().withMessage("Direccion inválidos"),
    body("telefono").isString().withMessage("Telefono inválido"),
    body("email").isEmail().withMessage("Email inválido"),
    body("codigo").isString().withMessage("Email inválido"),

  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  hospitalesController.registrarHospital
);
module.exports = router;
