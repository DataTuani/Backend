require("dotenv").config();
const express = require("express");
const path = require("path");
// Elimina o comenta expressOasGenerator si ya no lo usas
// const expressOasGenerator = require("express-oas-generator");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Agrega esto aquí ---
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API SINAES',
      version: '1.0.0',
    },
  },
  apis: ['./routes/*.js'], 
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Rutas
app.use("/api/auth", require("./routes/auth"));
app.use("/api/citas", require("./routes/citas"));
app.use("/api/filas", require("./routes/filas"));
app.use("/api/user", require("./routes/user"));

// Servidor
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});