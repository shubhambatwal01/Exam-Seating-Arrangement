const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    prn: String,
    name: String,
    email: String,
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    semesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true,
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    }],
});

// Add an index on prn for faster lookups
studentSchema.index({ prn: 1 }, { unique: true });


module.exports = mongoose.model('Student', studentSchema);