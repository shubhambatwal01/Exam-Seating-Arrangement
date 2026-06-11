const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/dbConnection");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
    const data = {
        message: [
            "Hello from the server!",
            "This is a sample response from the backend.",
            "You can replace this with your actual API endpoints and data.",
            "Feel free to customize this response as needed."
        ]
    };
    res.send(data);
});

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
});
