const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
    const data = {
        message: "Hello from the server!"
    };
    res.send(data);
});

mongoose.connect(process.env.DB_PATH).then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
});
