const mongoose = require("mongoose");

const timeTablesSchema = new mongoose.Schema({
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
  },

  generatedAt: {
    type: Date,
    default: Date.now,
  },

  exams: [
    {
      subjectCode: String,
      subjectName: String,
      date: Date,
      session: String,
    },
  ],
});

timeTablesSchema.index({ semesterId: 1 }, { unique: true });

module.exports = mongoose.model("TimeTable", timeTablesSchema);
