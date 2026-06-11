const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/dbConnection");
const subjectRoutes = require("./routes/subjectRoute");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/subjects",subjectRoutes);

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
});
