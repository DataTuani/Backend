const express = require("express");
const router = express.Router();
const { body, query, param, validationResult } = require("express-validator");
const citasController = require("../controllers/citas.controllers");
const { validarJWT } = require("../middlewares/validarjwt");
const upload = require("../middlewares/upload");

// REGISTRAR NUEVO TURNO MEDICO
router.post(
  "/",
  validarJWT,
  [
    body("medico_id").toInt().isInt().withMessage("Medico invalido"),
    body("hospital_id").toInt().isInt().withMessage("Hospital invalido"),
    body("fecha_hora").isISO8601().withMessage("Fecha/hora inválida"),
    body("motivo_consulta")
      .isString()
      .withMessage("Motivo de consulta inválida"),
    body("tipoCita").toInt().notEmpty().isInt().withMessage("Tipo inválido"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },

  citasController.agendarCita
);



module.exports = router;
