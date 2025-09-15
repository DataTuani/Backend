const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const expedienteController = require("../controllers/expediente.controllers");
const validate = require("../middlewares/validate");
const { validarJWT } = require("../middlewares/validarjwt");

router.get(
  "/:user_id",
  validarJWT,
  validate([
    param("user_id")
      .isInt()
      .withMessage("User_id inválido")
      .notEmpty()
      .withMessage("User_id es requerido"),
  ]),

  expedienteController.obtenerExpedientePorUser
);

router.put(
  "/:user_id",
  validarJWT,
  validate([
    param("user_id")
      .isInt()
      .withMessage("User_id inválido")
      .notEmpty()
      .withMessage("User_id es requerido"),
    body("telefono")
      .optional()
      .isLength({ min: 8, max: 8 })
      .withMessage("El teléfono debe tener 8 dígitos"),
    body("direccion")
      .optional()
      .isString()
      .withMessage("La dirección no es válida"),
    body("correo").optional().isEmail().withMessage("Correo inválido"),
    body("alergias")
      .optional()
      .isArray()
      .withMessage("Las alergias deben ser un array de cadenas de texto")
      .custom((arr) => arr.every((item) => typeof item === "string"))
      .withMessage("Cada alergia debe ser texto"),
    body("enfermedades_cronicas")
      .optional()
      .isArray()
      .withMessage(
        "Las enfermedades crónicas deben ser un array de cadenas de texto"
      )
      .custom((arr) => arr.every((item) => typeof item === "string"))
      .withMessage("Cada enfermedad debe ser texto"),
      body("observaciones")
      .optional()
      .isString()
      .withMessage("Observaciones inválidas")
  ]),

  expedienteController.editarExpediente
);

module.exports = router;
