const subject = require("../models/subject");

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await subject.find();
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSubject = async (req, res) => {
  const subjects = await subject.create(req.body);
  res.status(201).json(subjects);
};

exports.updateSubject = async (req, res) => {
  try {
    const subjects = await subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!subjects) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const subjects = await subject.findByIdAndDelete(req.params.id);
    if (!subjects) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
