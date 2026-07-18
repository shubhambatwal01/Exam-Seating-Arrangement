const Student = require("../models/student");

exports.getStudents = async (req, res, next) => {
  try {
    const students = await Student.find()
      .populate("courseId", "courseName")
      .populate("semesterId", "semesterNumber semesterName");
    res.json(students);
  } catch (error) {
    next(error);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    const { prn, name, email, courseId, semesterId, subjects } = req.body;
    if (!prn || !name || !email || !courseId || !semesterId) {
      res.status(400);
      throw new Error(
        "prn, name, email, courseId, and semesterId are required",
      );
    }
    const student = await Student.create({
      prn,
      name,
      email,
      courseId,
      semesterId,
      subjects,
    });
    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }
    res.json({ message: "Student deleted" });
  } catch (error) {
    next(error);
  }
};
