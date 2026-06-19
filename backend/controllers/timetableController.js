const Timetable = require("../models/timeTables");

const generateTimetable = require("../services/timetableGenerator");

exports.generate = async (req, res) => {
  try {
    const { semester, startDate, endDate } = req.body;

    const exams = await generateTimetable(semester, startDate, endDate);

    const timetable = await Timetable.create({
      semester,

      exams,
    });

    res.status(201).json(timetable);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
