const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const expedienteController = require("../controllers/expediente.controllers");
const validate = require("../middlewares/validate");
const { validarJWT } = require("../middlewares/validarjwt");

/**
 * @openapi
 * /api/expediente/{user_id}:
 *   get:
 *     summary: Obtener expediente por usuario
 *     tags:
 *       - Expediente
 *     parameters:
 *       - in: header
 *         name: x-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de autenticación
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Expediente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 telefono:
 *                   type: string
 *                 direccion:
 *                   type: string
 *                 correo:
 *                   type: string
 *                 alergias:
 *                   type: array
 *                   items:
 *                     type: string
 *                 enfermedades_cronicas:
 *                   type: array
 *                   items:
 *                     type: string
 *                 observaciones:
 *                   type: string
 *       400:
 *         description: User_id inválido
 *       401:
 *         description: Token inválido
 *       404:
 *         description: Expediente no encontrado
 */

/**
 * @openapi
 * /api/expediente/{user_id}:
 *   put:
 *     summary: Editar expediente de usuario
 *     tags:
 *       - Expediente
 *     parameters:
 *       - in: header
 *         name: x-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de autenticación
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telefono:
 *                 type: string
 *                 example: "88888888"
 *               direccion:
 *                 type: string
 *                 example: "Calle 123"
 *               correo:
 *                 type: string
 *                 example: "usuario@email.com"
 *               alergias:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Penicilina"]
 *               enfermedades_cronicas:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Diabetes"]
 *               observaciones:
 *                 type: string
 *                 example: "Paciente estable"
 *     responses:
 *       200:
 *         description: Expediente actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token inválido
 *       404:
 *         description: Expediente no encontrado
 */

router.get(
  "/todos",
  validarJWT,

  expedienteController.obtenerTodosExpedientes
);

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
      .withMessage("Observaciones inválidas"),
  ]),

  expedienteController.editarExpediente
);

module.exports = router;
