const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/dbConnection");
const subjectRoutes = require("./routes/subjectRoute");
const studentRoutes = require("./routes/studentRoute");
const facultyRoutes = require("./routes/facultyRoute");
const timetableRoutes = require("./routes/timetableRoutes");
const holidayRoutes = require("./routes/holidayRoute");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/subjects", subjectRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/holidays", holidayRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 1101;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
