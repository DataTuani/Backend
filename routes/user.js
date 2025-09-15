const express = require("express");
const router = express.Router();
const { body, validationResult, query, param } = require("express-validator");

const userController = require("../controllers/user.controllers");

const validate = require("../middlewares/validate");
const { validarJWT } = require("../middlewares/validarjwt");
const upload = require("../middlewares/upload");

/**
 * @swagger
 * /api/user/:
 *   get:
 *     summary: Obtener información del usuario
 *     tags:
 *       - Usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: rol_id
 *         required: true
 *         schema:
 *           type: integer
 */

/**
 * @swagger
 * /api/user/{usuario_id}/actualizar:
 *   put:
 *     summary: Actualizar datos de usuario
 *     tags:
 *       - Usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuario_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               primer_nombre:
 *                 type: string
 *               segundo_nombre:
 *                 type: string
 *               primer_apellido:
 *                 type: string
 *               segundo_apellido:
 *                 type: string
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *               cedula:
 *                 type: string
 *               telefono:
 *                 type: string
 *               genero:
 *                 type: string
 *                 enum: [M,F]
 *               direccion:
 *                 type: string
 *               Profile-image:
 *                 type: string
 *                 format: binary
 */

// 📌 Consultar estado de la fila para un paciente
router.get(
  "/",
  validarJWT,

  validate([
    query("user_id").isInt().withMessage("Usuario inválido"),
    query("rol_id").isInt().withMessage("Rol inválido"),
  ]),
  userController.getUserById
);

router.put(
  "/:usuario_id/actualizar",
  validarJWT,
  [
    param("usuario_id")
      .isInt()
      .withMessage("Id inválido")
      .notEmpty()
      .withMessage("Id es requerido"),
    body("primer_nombre").optional().isString().withMessage("Nombre inválido"),
    body("segundo_nombre")
      .optional()
      .isString()
      .withMessage("Segundo nombre inválido"),
    body("primer_apellido")
      .optional()
      .isString()
      .withMessage("Primer apellido inválido"),
    body("segundo_apellido")
      .optional()
      .isString()
      .withMessage("Segundo apellido inválido"),
    body("fecha_nacimiento")
      .optional()
      .isDate()
      .withMessage("La fecha de nacimiento no es válida"),
    body("cedula")
      .optional()
      .isString()
      .withMessage("La cédula debe ser texto"),
    body("telefono")
      .optional()
      .isLength({ min: 8, max: 8 })
      .withMessage("El teléfono debe tener 8 dígitos"),
    body("genero")
      .optional()
      .isIn(["M", "F"])
      .withMessage("El género debe ser Masculino o Femenino"),
    body("direccion")
      .optional()
      .isString()
      .withMessage("La dirección no es válida"),
    body("enfermedades_cronicas")
      .optional()
      .isArray()
      .withMessage(
        "Las enfermedades crónicas deben ser un array de cadenas de texto"
      )
      .custom((arr) => arr.every((item) => typeof item === "string"))
      .withMessage("Cada enfermedad debe ser texto"),
    body("alergias")
      .optional()
      .isArray()
      .withMessage("Las alergias deben ser un array de cadenas de texto")
      .custom((arr) => arr.every((item) => typeof item === "string"))
      .withMessage("Cada alergia debe ser texto"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  upload.single("Profile-image"),
  userController.actualizarUsuario
);

module.exports = router;
