const express = require("express");
const studentRoutes = express.Router();
const studentController = require("../controllers/studentController");

studentRoutes.get("/", studentController.getStudents);
studentRoutes.post("/", studentController.createStudent);
studentRoutes.delete("/:id", studentController.deleteStudent);

module.exports = studentRoutes;