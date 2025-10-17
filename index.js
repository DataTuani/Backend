require("dotenv").config();
require("./jobs/citasCron");

const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 8080;

/* =========================================================
   🔹 CONFIGURACIÓN DE CORS (para API REST)
   ========================================================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://sinaes.up.railway.app",          // backend en producción
  "https://tu-frontend.netlify.app",        // ejemplo frontend en deploy
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

/* =========================================================
   🔹 SWAGGER (Documentación API)
   ========================================================= */
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API SINAES",
      version: "1.0.0",
    },
  },
  apis: ["./routes/*.js"],
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* =========================================================
   🔹 MIDDLEWARES Y RUTAS
   ========================================================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/static/erd", express.static(path.join(__dirname, "prisma/ERD")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/citas", require("./routes/citas"));
app.use("/api/filas", require("./routes/filas"));
app.use("/api/user", require("./routes/user"));
app.use("/api/expediente", require("./routes/expediente"));
app.use("/api/ordenesLab", require("./routes/ordenesLab"));
app.use("/api/hospitales", require("./routes/hospitales"));
app.use("/api/enfermeria", require("./routes/enfermeria"));
app.use("/api/controlParental", require("./routes/controlParental"));

/* =========================================================
   🔹 SOCKET.IO (para videollamadas)
   ========================================================= */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type"],
  },
});

// Log de errores de conexión CORS (útil para Railway)
io.engine.on("connection_error", (err) => {
  console.log("❌ Error de conexión Socket.IO:", err.message);
  console.log("➡️ Origen:", err.req?.headers?.origin);
});

io.on("connection", (socket) => {
  console.log("✅ Usuario conectado:", socket.id);

  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
    console.log(`🟢 Usuario ${socket.id} se unió a la sala ${roomId}`);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", { offer });
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Usuario desconectado:", socket.id);
  });
});

/* =========================================================
   🔹 INICIO DEL SERVIDOR
   ========================================================= */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📘 Swagger Docs: http://localhost:${PORT}/api-docs`);
});
