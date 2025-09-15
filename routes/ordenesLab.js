const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const ordenesLabController = require("../controllers/ordenesLab.controllers");
const validate = require("../middlewares/validate");
const { validarJWT } = require("../middlewares/validarjwt");
const upload = require("../middlewares/upload");

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

  ordenesLabController.obtenerOrdenesLabPorId
);


router.put(
  "/:orden_id/upload",
  validarJWT,
  validate([
    param("orden_id")
      .isInt()
      .withMessage("Orden_id inválido")
      .notEmpty()
      .withMessage("Orden_id es requerido"),
  ]),
  upload.single("OrdenLaboratorio"),
  ordenesLabController.uploadOrdenLab
);

router.get(
  "/",
  validarJWT,
  ordenesLabController.obtenerOrdenesLab
);

module.exports = router;
