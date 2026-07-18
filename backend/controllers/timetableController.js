const Timetable = require("../models/timeTables");
const generateTimetable = require("../services/timetableGenerator");

exports.generate = async (req, res, next) => {
  try {
    const payload = req.body.data || req.body;
    const { semester, startDate, endDate } = payload;

    if (!semester || !startDate || !endDate) {
      res.status(400);
      throw new Error("semester, startDate, and endDate are required");
    }

    const exams = await generateTimetable(Number(semester), startDate, endDate);

    const timetable = await Timetable.create({
      semester: Number(semester),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      exams,
    });

    res.status(201).json(timetable);
  } catch (error) {
    next(error);
  }
};

exports.getTimetable = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.semester) query.semester = Number(req.query.semester);
    const timetable = await Timetable.find(query).sort({ generatedAt: -1 });
    res.json(timetable);
  } catch (error) {
    next(error);
  }
};
