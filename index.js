require("dotenv").config();
require("./jobs/citasCron");
const express = require("express");
const path = require("path");
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 8080;


const allowedOrigins = [
  "http://localhost:5173",  
];

app.use(cors(allowedOrigins));

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/static/erd", express.static(path.join(__dirname, "prisma/ERD")));

// Rutas
app.use("/api/auth", require("./routes/auth"));
app.use("/api/citas", require("./routes/citas"));
app.use("/api/filas", require("./routes/filas"));
app.use("/api/user", require("./routes/user"));
app.use("/api/expediente", require("./routes/expediente"));
app.use("/api/ordenesLab", require("./routes/ordenesLab"));
app.use("/api/hospitales", require("./routes/hospitales"));
app.use("/api/enfermeria", require("./routes/enfermeria"));
app.use("/api/controlParental", require("./routes/controlParental"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);

    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    console.log(`Usuarios en sala ${roomId}:`, clients);

    // Enviar al nuevo usuario la lista de peers existentes
    socket.emit("all-users", clients.filter((id) => id !== socket.id));

    // Notificar a los demás que hay un nuevo participante
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("offer", ({ roomId, offer, to }) => {
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ roomId, answer, to }) => {
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ roomId, candidate, to }) => {
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
    socket.broadcast.emit("peer-disconnected", socket.id);
  });
});


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
