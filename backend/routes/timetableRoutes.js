const express = require("express");

const timetableRouter = express.Router();

const timetableController = require("../controllers/timetableController");

timetableRouter.post("/generate", timetableController.generate);
timetableRouter.get("/", timetableController.getTimetable);

module.exports = timetableRouter;
