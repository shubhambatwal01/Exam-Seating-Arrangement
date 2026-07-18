const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  subjectName: {
    type: String,
    required: true,
    trim: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
  },
  duration: {
    type: Number,
    default: 0,
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium",
  },
});

module.exports = mongoose.model("Subject", subjectSchema);
