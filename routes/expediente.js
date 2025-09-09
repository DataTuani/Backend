const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const expedienteController = require("../controllers/auth.controllers");
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

module.exports = router;
