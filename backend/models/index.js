import mongoose from "mongoose";
const { Schema, model } = mongoose;

const User = model(
  "User",
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      passwordHash: { type: String, required: true, select: false },
      role: { type: String, enum: ["admin", "staff"], default: "staff" },
      active: { type: Boolean, default: true },
    },
    { timestamps: true },
  ),
);
const Department = model(
  "Department",
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
      },
    },
    { timestamps: true },
  ),
);
const Course = model(
  "Course",
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
      },
      department: {
        type: Schema.Types.ObjectId,
        ref: "Department",
        required: true,
        index: true,
      },
      duration: { type: Number, min: 1, max: 6, default: 2 },
    },
    { timestamps: true },
  ),
);
const semesterSchema = new Schema(
  {
    number: { type: Number, required: true, min: 1, max: 12 },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);
semesterSchema.index({ number: 1, course: 1 }, { unique: true });
const Semester = model("Semester", semesterSchema);
const Subject = model(
  "Subject",
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
      },
      semester: {
        type: Schema.Types.ObjectId,
        ref: "Semester",
        required: true,
        index: true,
      },
      department: {
        type: Schema.Types.ObjectId,
        ref: "Department",
        required: true,
        index: true,
      },
      course: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
        index: true,
      },
      duration: { type: Number, min: 30, max: 360, default: 120 },
    },
    { timestamps: true },
  ),
);
const Faculty = model(
  "Faculty",
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
      department: {
        type: Schema.Types.ObjectId,
        ref: "Department",
        required: true,
        index: true,
      },
      designation: { type: String, default: "Faculty" },
      active: { type: Boolean, default: true },
    },
    { timestamps: true },
  ),
);
const classroomSchema = new Schema(
  {
    roomNo: { type: String, required: true, unique: true, trim: true },
    building: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    rows: { type: Number, required: true, min: 1 },
    columns: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
classroomSchema.pre("validate", function (next) {
  if (this.rows * this.columns < this.capacity)
    this.invalidate("capacity", "Capacity cannot exceed rows × columns.");
  next();
});
const Classroom = model("Classroom", classroomSchema);
const studentSchema = new Schema(
  {
    rollNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    semester: {
      type: Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
      index: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["fresh", "backlog"],
      default: "fresh",
      index: true,
    },
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    email: { type: String, trim: true, lowercase: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
studentSchema.index({ department: 1, semester: 1, type: 1 });
const Student = model("Student", studentSchema);
const backlogSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    academicYear: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["registered", "cleared", "cancelled"],
      default: "registered",
      index: true,
    },
  },
  { timestamps: true },
);
backlogSchema.index(
  { student: 1, subject: 1, academicYear: 1 },
  { unique: true },
);
const BacklogRegistration = model("BacklogRegistration", backlogSchema);
const timeSlotSchema = new Schema(
  {
    label: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false },
);
const examSessionSchema = new Schema(
  {
    name: { type: String, required: true },
    academicYear: { type: String, required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "completed"],
      default: "draft",
    },
    timeSlots: {
      type: [timeSlotSchema],
      default: [
        { label: "Morning", startTime: "10:00", endTime: "12:00" },
        { label: "Afternoon", startTime: "14:00", endTime: "16:00" },
      ],
    },
    excludedDates: [Date],
    seatingRules: {
      minGap: { type: Number, min: 0, max: 5, default: 1 },
      backlogMode: {
        type: String,
        enum: ["intersperse", "separate"],
        default: "intersperse",
      },
    },
  },
  { timestamps: true },
);
examSessionSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate)
    this.invalidate("endDate", "End date must be on or after start date.");
  next();
});
const ExamSession = model("ExamSession", examSessionSchema);
const timetableSchema = new Schema(
  {
    examSession: {
      type: Schema.Types.ObjectId,
      ref: "ExamSession",
      required: true,
      index: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    slotLabel: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, min: 30, max: 360, default: 120 },
    manualOverride: { type: Boolean, default: false },
  },
  { timestamps: true },
);
timetableSchema.index({ examSession: 1, subject: 1 }, { unique: true });
timetableSchema.index({ examSession: 1, date: 1, slotLabel: 1 });
const Timetable = model("Timetable", timetableSchema);
const seatSchema = new Schema(
  {
    seatNo: String,
    row: Number,
    col: Number,
    studentId: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    rollNo: { type: String, default: "" },
    studentName: { type: String, default: "" },
    subjectCode: { type: String, default: "" },
    appearanceType: {
      type: String,
      enum: ["fresh", "backlog", "empty"],
      default: "empty",
    },
    attendance: {
      type: String,
      enum: ["unmarked", "present", "absent"],
      default: "unmarked",
    },
  },
  { _id: false },
);
const seatingSchema = new Schema(
  {
    examSession: {
      type: Schema.Types.ObjectId,
      ref: "ExamSession",
      required: true,
      index: true,
    },
    classroom: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    timeSlot: { type: String, required: true, index: true },
    seatMap: { type: [seatSchema], default: [] },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
seatingSchema.index(
  { examSession: 1, classroom: 1, date: 1, timeSlot: 1 },
  { unique: true },
);
const SeatingArrangement = model("SeatingArrangement", seatingSchema);
const SystemSetting = model(
  "SystemSetting",
  new Schema(
    {
      key: { type: String, unique: true, default: "global" },
      defaultExamDuration: { type: Number, default: 120 },
      defaultBacklogMode: {
        type: String,
        enum: ["intersperse", "separate"],
        default: "intersperse",
      },
      minGapBetweenSameSubject: { type: Number, min: 0, max: 5, default: 1 },
    },
    { timestamps: true },
  ),
);
export {
  User,
  Department,
  Course,
  Semester,
  Subject,
  Faculty,
  Classroom,
  Student,
  BacklogRegistration,
  ExamSession,
  Timetable,
  SeatingArrangement,
  SystemSetting,
};
