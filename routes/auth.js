const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/auth.controllers");
const validate = require("../middlewares/validate");



/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registro de usuario
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - password
 *               - primer_nombre
 *               - segundo_nombre
 *               - primer_apellido
 *               - segundo_apellido
 *               - cedula
 *               - fecha_nacimiento
 *               - telefono
 *               - genero
 *               - direccion
 *               - rol_id
 *               - grupo_sanguineo
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               primer_nombre:
 *                 type: string
 *               segundo_nombre:
 *                 type: string
 *               primer_apellido:
 *                 type: string
 *               segundo_apellido:
 *                 type: string
 *               cedula:
 *                 type: string
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *               telefono:
 *                 type: string
 *               genero:
 *                 type: string
 *                 enum: [M,F]
 *               direccion:
 *                 type: string
 *               rol_id:
 *                 type: integer
 *               grupo_sanguineo:
 *                 type: string
 *               enfermedades_cronicas:
 *                 type: array
 *                 items:
 *                   type: string
 *               alergias:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Usuario registrado correctamente
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login de usuario
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contraseña
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *               contraseña:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve token
  */

router.post(
  "/register",
  validate([
    body("correo").isEmail().withMessage("El correo electrónico no es válido"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres"),
    body("primer_nombre").notEmpty().withMessage("El primer nombre es obligatorio"),
    body("segundo_nombre").notEmpty().withMessage("El segundo nombre es obligatorio"),
    body("primer_apellido").notEmpty().withMessage("El primer apellido es obligatorio"),
    body("segundo_apellido").notEmpty().withMessage("El segundo apellido es obligatorio"),
    body("cedula").notEmpty().withMessage("La cédula es obligatoria"),
    body("fecha_nacimiento").isDate().withMessage("La fecha de nacimiento no es válida"),
    body("telefono")
      .isLength({ min: 8, max: 8 })
      .withMessage("El teléfono debe tener 8 dígitos"),
    body("genero").isIn(["M", "F"]).withMessage("El género debe ser Masculino o Femenino"),
    body("direccion").notEmpty().withMessage("La dirección es obligatoria"),
    body("rol_id").isInt().withMessage("El rol es requerido y debe ser un número entero"),
    body("grupo_sanguineo").notEmpty().withMessage("El grupo sanguíneo es obligatorio"),
    body("enfermedades_cronicas")
      .optional()
      .isArray()
      .withMessage("Las enfermedades crónicas deben ser un array de cadenas de texto")
      .custom((arr) => arr.every((item) => typeof item === "string"))
      .withMessage("Cada enfermedad debe ser texto"),
    body("alergias")
      .optional()
      .isArray()
      .withMessage("Las alergias deben ser un array de cadenas de texto")
      .custom((arr) => arr.every((item) => typeof item === "string"))
      .withMessage("Cada alergia debe ser texto"),
  ]),
  authController.register
);

router.post(
  "/login",
  validate([
    body("correo").isEmail().withMessage("El correo electrónico no es válido"),
    body("contraseña")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres"),
  ]),
  authController.login
);

module.exports = router;
