const express = require("express");
const router = express.Router();
const { body, validationResult, query, param } = require("express-validator");

const filasController = require("../controllers/filas.controllers");

const validate = require("../middlewares/validate");
const { validarJWT } = require("../middlewares/validarjwt");


/**
 * @openapi
 * /api/filas:
 *   get:
 *     summary: Consultar estado de la fila para un paciente
 *     tags:
 *       - Filas
 *     parameters:
 *       - in: header
 *         name: x-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de autenticación
 *       - in: query
 *         name: paciente_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *       - in: query
 *         name: hospital_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del hospital
 *     responses:
 *       200:
 *         description: Estado de la fila para el paciente
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Token inválido
 */

/**
 * @openapi
 * /api/filas/filaHospital:
 *   get:
 *     summary: Consultar estado de la fila de un hospital
 *     tags:
 *       - Filas
 *     parameters:
 *       - in: header
 *         name: x-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de autenticación
 *       - in: query
 *         name: hospital_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del hospital
 *     responses:
 *       200:
 *         description: Estado actual de la fila del hospital
 *       400:
 *         description: Hospital inválido
 *       401:
 *         description: Token inválido
 */

// // 📌 Unirse a la fila (crear turno)
// router.post(
//   "/",
//     validarJWT,
  
//   validate([
//     body("paciente_id").isInt().withMessage("Paciente inválido"),
//     body("hospital_id").isInt().withMessage("Hospital inválido"),
//   ]),
//   filasController.unirseFila
// );

// 📌 Consultar estado de la fila para un paciente
router.get(
  "/:paciente_id/",
  validarJWT,

  validate([
    param("paciente_id").isInt().withMessage("Paciente inválido"),
  ]),
  filasController.estadoFilaPaciente
);


router.get(
  "/filaHospital",
  validarJWT,

  validate([
    query("hospital_id").isInt().withMessage("Hospital inválido"),
  ]),
  filasController.estadoFilaHospital
);


// // 📌 Avanzar fila de un hospital
// router.patch(
//   "/:hospital_id/avanzar",
//   validarJWT,

//   validate([
//     param("hospital_id").isInt().withMessage("Hospital inválido"),
//   ]),
//   filasController.avanzarFila
// );

// // 📌 Cancelar turno específico
// router.delete(
//   "/:turno_id",
//   validarJWT,

//   validate([
//     param("turno_id").isInt().withMessage("Turno inválido"),
//   ]),
//   filasController.cancelarTurno
// );

module.exports = router;
