const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  subjectCode: String,
  subjectName: String,
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
    required: true,
  },
  duration: Number,
  difficultyLevel: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy",
  },
});

subjectSchema.index({ subjectCode: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
