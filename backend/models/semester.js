const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  semesterNumber: Number,
  semesterName: String,
});

module.exports = mongoose.model("Semester", semesterSchema);
