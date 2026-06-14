const Student = require("../models/student");

exports.getStudents = async (req, res) => {
  const students = await Student.find();
  res.json(students);
};

exports.createStudent = async (req, res) => {
  const student = await Student.create(req.body);
  res.status(201).json(student);
};

exports.deleteStudent = async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) {
    return res.status(404).json({ message: "Student doesn't found" });
  }
  res.json({ message: "Student deleted" });
};