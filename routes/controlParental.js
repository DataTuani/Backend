const express = require("express");
const router = express.Router();
const { body, validationResult, query, param } = require("express-validator");

const controlParental = require("../controllers/controlParental.controllers");

const validate = require("../middlewares/validate");
const { validarJWT } = require("../middlewares/validarjwt");

router.get(
  "/generar-otp",
  validarJWT,
  [
    body("usuario_id").isInt().withMessage("Id invalido"),
  
  ],
  controlParental.generarOTP
);

router.post(
  "/validar-otp",
  validarJWT,
  [
    body("usuario_hijo_id").isInt().withMessage("Id invalido"),
    body("codigo").isString().withMessage("Codigo invalido"),
  
  ],
  controlParental.validarOTP
);

module.exports = router;
