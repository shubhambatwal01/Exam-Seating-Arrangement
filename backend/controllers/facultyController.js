const Faculty = require("../models/faculty");

exports.getFaculties = async (req, res, next) => {
  try {
    const faculties = await Faculty.find();
    res.status(200).json(faculties);
  } catch (error) {
    next(error);
  }
};

exports.createFaculty = async (req, res, next) => {
  try {
    const { facultyName, subjectId } = req.body;
    if (!facultyName || !subjectId) {
      res.status(400);
      throw new Error("facultyName and subjectId are required");
    }

    const faculty = await Faculty.create({ facultyName, subjectId });
    res.status(201).json(faculty);
  } catch (error) {
    next(error);
  }
};

exports.deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      res.status(404);
      throw new Error("Faculty not found");
    }
    res.status(200).json({ message: "Faculty deleted successfully" });
  } catch (error) {
    next(error);
  }
};
