const Subject = require("../models/subject");

exports.getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ semester: 1, subjectName: 1 });
    res.json(subjects);
  } catch (err) {
    next(err);
  }
};

exports.createSubject = async (req, res, next) => {
  try {
    const {
      subjectCode,
      subjectName,
      semester,
      difficulty,
      duration,
      semesterId,
    } = req.body;
    if (!subjectCode || !subjectName || semester === undefined) {
      res.status(400);
      throw new Error("subjectCode, subjectName, and semester are required");
    }

    const subject = await Subject.create({
      subjectCode,
      subjectName,
      semester: Number(semester),
      difficulty,
      duration,
      semesterId,
    });

    res.status(201).json(subject);
  } catch (err) {
    next(err);
  }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }
    res.json(subject);
  } catch (err) {
    next(err);
  }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }
    res.json({ message: "Subject deleted" });
  } catch (err) {
    next(err);
  }
};
