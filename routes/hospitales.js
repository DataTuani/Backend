const express = require("express");
const router = express.Router();
const { body, validationResult, query, param } = require("express-validator");

const hospitalesController = require("../controllers/hospital.controllers");

const validate = require("../middlewares/validate");
const { validarJWT } = require("../middlewares/validarjwt");

router.get("/", validarJWT, hospitalesController.hospitales);

module.exports = router;
