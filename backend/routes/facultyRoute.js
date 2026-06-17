const express = require("express");
const facultyRoutes = express.Router();
const facultyController = require("../controllers/facultyController");

facultyRoutes.get("/", facultyController.getFaculties);
facultyRoutes.post("/", facultyController.createFaculty);
facultyRoutes.delete("/:id", facultyController.deleteFaculty);

module.exports = facultyRoutes;