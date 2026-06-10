const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
  facultyName: String,
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
});

module.exports = mongoose.model("Faculty", facultySchema);
