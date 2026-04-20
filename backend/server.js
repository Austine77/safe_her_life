import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import connectDatabase from "./database/connection.js";
import User from "./models/User.js";
import authRoutes from "./routes/authRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import pinRoutes from "./routes/pinRoutes.js";
import policeContactRoutes from "./routes/policeContactRoutes.js";
import { setIo } from "./realtime.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const frontendDir = path.join(projectRoot, "frontend");
const frontendImagesDir = path.join(frontendDir, "images");

const envOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGINS,
]
  .flatMap((value) => String(value || "").split(","))
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...envOrigins,
  "https://safeherlife-frontend.onrender.com",
  "https://safeherlife-frontend.onrender.com",
  "https://safevoice-frontend.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (uniqueAllowedOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (hostname.endsWith(".onrender.com")) return true;
  } catch (error) {
    return false;
  }

  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH"],
  },
});

setIo(io);

io.on("connection", (socket) => {
  socket.on("join-case", (caseId) => {
    const safeCaseId = String(caseId || "").trim();
    if (safeCaseId) socket.join(`case:${safeCaseId}`);
  });

  socket.on("leave-case", (caseId) => {
    const safeCaseId = String(caseId || "").trim();
    if (safeCaseId) socket.leave(`case:${safeCaseId}`);
  });
});

let dbConnection = null;


function sendFrontendFile(res, filename) {
  const filePath = path.join(frontendDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: `Frontend file not found: ${filename}`,
    });
  }

  return res.sendFile(filePath);
}

/*
  Frontend static hosting
*/
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir));

  if (fs.existsSync(frontendImagesDir)) {
    app.use("/images", express.static(frontendImagesDir));
  }
}

/*
  Frontend pages
*/
app.get("/", (_req, res) => {
  return sendFrontendFile(res, "index.html");
});

app.get("/index.html", (_req, res) => {
  return sendFrontendFile(res, "index.html");
});

app.get("/staff.html", (_req, res) => {
  return sendFrontendFile(res, "staff.html");
});

app.get("/team.html", (_req, res) => {
  return sendFrontendFile(res, "team.html");
});

app.get("/police-contact.html", (_req, res) => {
  return sendFrontendFile(res, "police-contact.html");
});

/*
  Health routes
*/
app.get("/api", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SafeHerLife backend API is running",
    status: "ok",
    mongoReadyState: dbConnection?.readyState ?? 0,
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    mongoReadyState: dbConnection?.readyState ?? 0,
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    mongoReadyState: dbConnection?.readyState ?? 0,
  });
});

/*
  Auth + PIN
*/
app.use("/api/auth", authRoutes);
app.use("/api/pin", pinRoutes);
app.use("/api/police-contacts", policeContactRoutes);

/*
  Case routes
*/
app.use("/api/cases", caseRoutes);
app.use("/cases", caseRoutes);

/*
  Report routes
*/
app.use("/api/report", reportRoutes);
app.use("/api/reports", reportRoutes);
app.use("/report", reportRoutes);
app.use("/reports", reportRoutes);

/*
  Non-API fallback:
  if user opens any unknown frontend route, return index.html
*/
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    return next();
  }

  if (fs.existsSync(path.join(frontendDir, "index.html"))) {
    return res.sendFile(path.join(frontendDir, "index.html"));
  }

  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
  API 404
*/
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  console.error("Server error:", error.message);

  if (error?.message?.startsWith("CORS blocked")) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message,
  });
});

async function startServer() {
  try {
    dbConnection = await connectDatabase(process.env.MONGODB_URI);

    if (dbConnection.readyState !== 1) {
      throw new Error(
        `MongoDB connection is not ready. Current readyState: ${dbConnection.readyState}`
      );
    }

    console.log("Mongoose readyState:", dbConnection.readyState);


    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Allowed CORS origins:", uniqueAllowedOrigins);
      console.log("Frontend directory:", frontendDir);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

startServer();