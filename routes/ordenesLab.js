const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const ordenesLabController = require("../controllers/ordenesLab.controllers");
const validate = require("../middlewares/validate");
const { validarJWT } = require("../middlewares/validarjwt");
const upload = require("../middlewares/upload");

/**
 * @openapi
 * /api/ordenesLab:
 *   get:
 *     summary: Obtener todas las órdenes de laboratorio
 *     tags:
 *       - OrdenesLab
 *     parameters:
 *       - in: header
 *         name: x-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de autenticación
 *     responses:
 *       200:
 *         description: Lista de órdenes de laboratorio
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   pacienteId:
 *                     type: integer
 *                   examenes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   archivo:
 *                     type: string
 *                     description: URL del archivo PDF si existe
 *       401:
 *         description: Token inválido
 */

/**
 * @openapi
 * /api/ordenesLab/{user_id}:
 *   get:
 *     summary: Obtener órdenes de laboratorio por usuario
 *     tags:
 *       - OrdenesLab
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
 *         description: Lista de órdenes de laboratorio del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   pacienteId:
 *                     type: integer
 *                   examenes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   archivo:
 *                     type: string
 *                     description: URL del archivo PDF si existe
 *       400:
 *         description: User_id inválido
 *       401:
 *         description: Token inválido
 */

/**
 * @openapi
 * /api/ordenesLab/{orden_id}/upload:
 *   put:
 *     summary: Subir archivo PDF a una orden de laboratorio
 *     tags:
 *       - OrdenesLab
 *     parameters:
 *       - in: header
 *         name: x-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de autenticación
 *       - in: path
 *         name: orden_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden de laboratorio
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               OrdenLaboratorio:
 *                 type: string
 *                 format: binary
 *                 description: Archivo PDF de la orden
 *     responses:
 *       200:
 *         description: Archivo subido correctamente
 *       400:
 *         description: Orden_id inválido o archivo faltante
 *       401:
 *         description: Token inválido
 */


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
