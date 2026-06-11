const express = require("express");
const subjectRoutes = express.Router();
const subjectController = require("../controllers/subjectController");

subjectRoutes.get("/", subjectController.getSubjects);
subjectRoutes.post("/", subjectController.createSubject);
subjectRoutes.put("/:id", subjectController.updateSubject);
subjectRoutes.delete("/:id", subjectController.deleteSubject);

module.exports = subjectRoutes;