const express = require("express");
const router = express.Router();
const { body, query, param, validationResult } = require("express-validator");
const citasController = require("../controllers/citas.controllers");
const { validarJWT } = require("../middlewares/validarjwt");
const upload = require("../middlewares/upload");

/**
 * @openapi
 * /api/citas:
 *   post:
 *     summary: Agendar una nueva cita
 *     tags:
 *       - Citas
 *     parameters:
 *       - in: header
 *         name: x-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paciente_id
 *               - hospital_id
 *               - fecha_hora
 *               - motivo_consulta
 *               - tipoCita
 *             properties:
 *               paciente_id:
 *                 type: integer
 *                 example: 123
 *               hospital_id:
 *                 type: integer
 *                 example: 5
 *               fecha_hora:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-08T15:30:00Z"
 *               motivo_consulta:
 *                 type: string
 *                 example: "Dolor de cabeza"
 *               tipoCita:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Cita agendada correctamente
 *       400:
 *         description: Error en los datos enviados
 *       401:
 *         description: Token no válido o inexistente
 */

/**
 * @openapi
 * /api/citas/{cita_id}:
 *   get:
 *     summary: Obtener Cita por Id
 *     tags:
 *       - Citas
 *     parameters:
 *       - in: header
 *         name: x-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de autenticación
 *       - in: path
 *         name: cita_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cita a obtener
 *     responses:
 *       200:
 *         description: Cita encontrada
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Token inválido o expirado
 */

/**
 * @openapi
 * /api/citas/hospital:
 *   get:
 *     summary: Obtener citas por hospital
 *     tags:
 *       - Citas
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
 *         description: Lista de citas por hospital
 *       400:
 *         description: Hospital inválido
 *       401:
 *         description: Token inválido
 */

/**
 * @openapi
 * /api/citas/paciente:
 *   get:
 *     summary: Obtener citas por paciente
 *     tags:
 *       - Citas
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
 *     responses:
 *       200:
 *         description: Lista de citas del paciente
 *       400:
 *         description: Paciente inválido
 *       401:
 *         description: Token inválido
 */

/**
 * @openapi
 * /api/citas/doctor:
 *   get:
 *     summary: Obtener citas por doctor
 *     tags:
 *       - Citas
 *     parameters:
 *       - in: header
 *         name: x-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de autenticación
 *       - in: query
 *         name: personal_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del doctor
 *     responses:
 *       200:
 *         description: Lista de citas del doctor
 *       400:
 *         description: Doctor inválido
 *       401:
 *         description: Token inválido
 */

/**
 * @openapi
 * /api/citas/{id}/cancelar:
 *   put:
 *     summary: Cancelar una cita
 *     tags:
 *       - Citas
 *     parameters:
 *       - in: header
 *         name: x-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de autenticación
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cita a cancelar
 *     responses:
 *       200:
 *         description: Cita cancelada correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Token inválido
 */

// NUUEVA CITA
router.post(
  "/",
  validarJWT,
  upload.single("Motivo-Consulta"),

  [
    body("paciente_id").toInt().isInt().withMessage("Paciente invalido"),
    body("hospital_id").toInt().isInt().withMessage("Medico invalido"),
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

router.post(
  "/atender/:cita_id",
  validarJWT,
  [
    param("cita_id").isInt().withMessage("Cita inválida"),
    body("sintomas").isString().withMessage("Síntomas inválidos"),
    body("diagnostico").isString().withMessage("Diagnóstico inválido"),
    body("tratamiento").isString().withMessage("Tratamiento inválido"),
    body("medicamentos")
      .optional()
      .isArray()
      .withMessage("Medicamentos debe ser un array"),
    body("ordenes")
      .optional()
      .isArray()
      .withMessage("Órdenes debe ser un array"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  citasController.atenderCita
);
// CITAS POR HOSPITAL
router.get(
  "/hospital",
  validarJWT,
  [
    query("hospital_id")
      .isInt()
      .withMessage("Hospital inválido")
      .notEmpty()
      .withMessage("Hospital es requerido"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  citasController.obtenerCitasPorHospital
);

// CITAS POR PACIENTE
router.get(
  "/paciente",
  validarJWT,
  [
    query("paciente_id")
      .isInt()
      .withMessage("Paciente inválido")
      .notEmpty()
      .withMessage("Paciente es requerido"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  citasController.obtenerCitasPorPaciente
);

// CITAS POR DOCTOR
router.get(
  "/doctor",
  validarJWT,
  [
    query("personal_id")
      .isInt()
      .withMessage("Personal inválido")
      .notEmpty()
      .withMessage("Personal es requerido"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  citasController.obtenerCitasPorDoctor
);

// CITAS POR ID
router.get(
  "/:cita_id",
  validarJWT,
  [
    param("cita_id")
      .isInt()
      .withMessage("Id inválido")
      .notEmpty()
      .withMessage("Id es requerido"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  citasController.obtenerCitaPorId
);

// CONSULTA POR ID CITA
router.get(
  "/consulta/:cita_id",
  validarJWT,
  [
    param("cita_id")
      .isInt()
      .withMessage("Id inválido")
      .notEmpty()
      .withMessage("Id es requerido"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  citasController.obtenerConsultaPorId
);

// CANCELAR CITA
router.put(
  "/:id/cancelar",
  validarJWT,
  [
    param("id")
      .isInt()
      .withMessage("Id inválido")
      .notEmpty()
      .withMessage("Id es requerido"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  citasController.cancelarCita
);

module.exports = router;
