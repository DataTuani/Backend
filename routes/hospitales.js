const express = require("express");
const router = express.Router();
const { body, validationResult, query, param } = require("express-validator");

const hospitalesController = require("../controllers/hospital.controllers");

const validate = require("../middlewares/validate");
const { validarJWT } = require("../middlewares/validarjwt");


/**
 * @openapi
 * /api/hospitales:
 *   get:
 *     summary: Obtener todos los hospitales
 *     tags:
 *       - Hospitales
 *     parameters:
 *       - in: header
 *         name: x-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de autenticación
 *     responses:
 *       200:
 *         description: Lista de hospitales
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   direccion:
 *                     type: string
 *                   telefono:
 *                     type: string
 *                   email:
 *                     type: string
 */

/**
 * @openapi
 * /api/hospitales/registrar:
 *   post:
 *     summary: Registrar un nuevo hospital
 *     tags:
 *       - Hospitales
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
 *               - nombre
 *               - direccion
 *               - telefono
 *               - email
 *               - codigo
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Hospital Central"
 *               direccion:
 *                 type: string
 *                 example: "Calle 123"
 *               telefono:
 *                 type: string
 *                 example: "88888888"
 *               email:
 *                 type: string
 *                 example: "hospital@email.com"
 *               codigo:
 *                 type: string
 *                 example: "HC123"
 *     responses:
 *       201:
 *         description: Hospital registrado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token inválido
 */

router.get("/", validarJWT, hospitalesController.hospitales);

router.post(
  "/registrar",
  validarJWT,
  [
    body("nombre").isString().withMessage("Nombre inválida"),
    body("direccion").isString().withMessage("Direccion inválidos"),
    body("telefono").isString().withMessage("Telefono inválido"),
    body("email").isEmail().withMessage("Email inválido"),
    body("codigo").isString().withMessage("Email inválido"),

  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  hospitalesController.registrarHospital
);
module.exports = router;
