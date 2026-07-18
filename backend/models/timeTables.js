const mongoose = require("mongoose");

const timeTablesSchema = new mongoose.Schema({
  semester: {
    type: Number,
    required: true,
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  exams: [
    {
      subjectCode: String,
      subjectName: String,
      difficulty: String,
      date: Date,
      session: String,
    },
  ],
});

timeTablesSchema.index({ semester: 1 }, { unique: true });

module.exports = mongoose.model("TimeTable", timeTablesSchema);
