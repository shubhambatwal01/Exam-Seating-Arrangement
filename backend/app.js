import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import auth from "./routes/auth.routes.js";
import master from "./routes/master.routes.js";
import students from "./routes/students.routes.js";
import exams from "./routes/exams.routes.js";
import reports from "./routes/reports.routes.js";
import admin from "./routes/admin.routes.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://exam-seating-allotment.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("Blocked by CORS:", origin);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "Exam Seating & Timetable API",
    },
    message: "API is healthy.",
    error: null,
  });
});
app.use("/api/v1/auth", auth);
app.use("/api/v1", master);
app.use("/api/v1/students", students);
app.use("/api/v1", exams);
app.use("/api/v1/reports", reports);
app.use("/api/v1", admin);
app.use(notFound);
app.use(errorHandler);
const port = Number(process.env.PORT || 1101);
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Exam API running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start:", error.message);
    process.exit(1);
  });
