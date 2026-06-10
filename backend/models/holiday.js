const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
  date: Date,
  reason: String,
});

module.exports = mongoose.model("Holiday", holidaySchema);