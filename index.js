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
    methods: ["GET", "POST"]
  }
});
io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado:", socket.id);

  // 🔹 Unirse a una sala
  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
    console.log(`👥 Usuario ${socket.id} se unió a la sala ${roomId}`);

    const room = io.sockets.adapter.rooms.get(roomId);
    const numClients = room ? room.size : 0;

    // Si ya hay otro usuario en la sala, avísale al primero
    if (numClients > 1) {
      socket.to(roomId).emit("ready");
    }
  });

  // 🔹 Offer / Answer / ICE candidates
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", { offer });
    console.log("📤 Offer reenviada a sala:", roomId);
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { answer });
    console.log("📩 Answer reenviada a sala:", roomId);
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Usuario desconectado:", socket.id);
  });
});
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
