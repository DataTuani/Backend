const express = require("express");
const router = express.Router();
const { body, validationResult, query, param } = require("express-validator");

const filasController = require("../controllers/filas.controllers");

const validate = require("../middlewares/validate");
const { validarJWT } = require("../middlewares/validarjwt");



/**
 * @swagger
 * /api/filas/:
 *   post:
 *     summary: Unirse a la fila (crear turno)
 *     tags:
 *       - Filas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paciente_id
 *               - hospital_id
 *             properties:
 *               paciente_id:
 *                 type: integer
 *                 example: 123
 *               hospital_id:
 *                 type: integer
 *                 example: 5
 */

/**
 * @swagger
 * /api/filas/:
 *   get:
 *     summary: Consultar estado de la fila para un paciente
 *     tags:
 *       - Filas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paciente_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: hospital_id
 *         required: true
 *         schema:
 *           type: integer
 */
/**
 * @swagger
 * /api/filas/filaHospital:
 *   get:
 *     summary: Consultar estado de la fila de un hospital
 *     tags:
 *       - Filas
 *     security:
 *       - bearerAuth: []
 *     parameters:
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

/**
 * @swagger
 * /api/filas/{hospital_id}/avanzar:
 *   patch:
 *     summary: Avanzar la fila de un hospital
 *     tags:
 *       - Filas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospital_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del hospital cuya fila se va a avanzar
 *     responses:
 *       200:
 *         description: Fila avanzada correctamente
 *       400:
 *         description: Hospital inválido
 *       401:
 *         description: Token inválido
 */

/**
 * @swagger
 * /api/filas/{turno_id}:
 *   delete:
 *     summary: Cancelar un turno específico
 *     tags:
 *       - Filas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: turno_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del turno a cancelar
 *     responses:
 *       200:
 *         description: Turno cancelado correctamente
 *       400:
 *         description: Turno inválido
 *       401:
 *         description: Token inválido
 */



// 📌 Unirse a la fila (crear turno)
router.post(
  "/",
    validarJWT,
  
  validate([
    body("paciente_id").isInt().withMessage("Paciente inválido"),
    body("hospital_id").isInt().withMessage("Hospital inválido"),
  ]),
  filasController.unirseFila
);

// 📌 Consultar estado de la fila para un paciente
router.get(
  "/",
  validarJWT,

  validate([
    query("paciente_id").isInt().withMessage("Paciente inválido"),
    query("hospital_id").isInt().withMessage("Hospital inválido"),
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


// 📌 Avanzar fila de un hospital
router.patch(
  "/:hospital_id/avanzar",
  validarJWT,

  validate([
    param("hospital_id").isInt().withMessage("Hospital inválido"),
  ]),
  filasController.avanzarFila
);

// 📌 Cancelar turno específico
router.delete(
  "/:turno_id",
  validarJWT,

  validate([
    param("turno_id").isInt().withMessage("Turno inválido"),
  ]),
  filasController.cancelarTurno
);

module.exports = router;
