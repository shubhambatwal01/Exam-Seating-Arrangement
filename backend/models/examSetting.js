const mongoose = require("mongoose");

const examSettingSchema = new mongoose.Schema({
    examType: String,
    startDate: Date,
    endDate: Date,
    sessionPerDay: Number,
});

module.exports = mongoose.model('ExamSetting', examSettingSchema);