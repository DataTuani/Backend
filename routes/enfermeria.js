const express = require("express");
const router = express.Router();
const { body, query, param, validationResult } = require("express-validator");
const enfermeriaController = require("../controllers/enfermeria.controllers");
const { validarJWT } = require("../middlewares/validarjwt");
const upload = require("../middlewares/upload");

/**
 * @openapi
 * /api/enfermeria/turno:
 *   post:
 *     summary: Registrar un nuevo turno médico
 *     tags:
 *       - Enfermeria
 *     parameters:
 *       - in: header
 *         name: x-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de autenticación
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - medico_id
 *               - hospital_id
 *               - hora_inicio
 *               - hora_fin
 *             properties:
 *               medico_id:
 *                 type: integer
 *                 example: 1
 *               hospital_id:
 *                 type: integer
 *                 example: 2
 *               hora_inicio:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-08T08:00:00Z"
 *               hora_fin:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-08T16:00:00Z"
 *     responses:
 *       201:
 *         description: Turno registrado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token inválido
 */

/**
 * @openapi
 * /api/enfermeria/turnoHospital:
 *   get:
 *     summary: Obtener turnos médicos por hospital
 *     tags:
 *       - Enfermeria
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
 *         description: Lista de turnos médicos del hospital
 *       400:
 *         description: Hospital inválido
 *       401:
 *         description: Token inválido
 */

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

router.get("/turnos-disponibles", validarJWT, [
  query("hospital_id")
    .notEmpty()
    .toInt()
    .isInt()
    .withMessage("Hospital inválido"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  enfermeriaController.turnos_disponibles,
]);

module.exports = router;
