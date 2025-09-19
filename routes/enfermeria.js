const express = require("express");
const router = express.Router();
const { body, query, param, validationResult } = require("express-validator");
const enfermeriaController = require("../controllers/enfermeria.controllers");
const { validarJWT } = require("../middlewares/validarjwt");
const upload = require("../middlewares/upload");

// REGISTRAR NUEVO TURNO MEDICO
router.post(
  "/turno",
  validarJWT,
  [
    body("medico_id").toInt().isInt().withMessage("Medico invalido"),
    body("hospital_id").toInt().isInt().withMessage("Hospital invalido"),
    body("hora_inicio").isISO8601().withMessage("Fecha/hora Inicio inválida"),
    body("hora_fin").isISO8601().withMessage("Fecha/hora Fin inválida"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },

  enfermeriaController.agregarTurnoMedico
);

router.get(
  "/turnoHospital",
  validarJWT,
  [query("hospital_id").toInt().isInt().withMessage("Hospital inválido")],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  enfermeriaController.turnosHospital
);


module.exports = router;
