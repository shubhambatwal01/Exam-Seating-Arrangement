import {
  ExamSession,
  SeatingArrangement,
  Subject,
  SystemSetting,
  Timetable,
} from "../models/index.js";
import { generateSeating as runSeatingGenerator } from "../services/seating.js";
import {
  generateTimetable as runTimetableGenerator,
  manualMove,
} from "../services/timetable.js";
import { ApiError, ok } from "../utils/http.js";

export async function listExamSessions(_req, res) {
  return ok(res, await ExamSession.find().sort({ startDate: -1 }).lean());
}

export async function getExamSession(req, res) {
  const item = await ExamSession.findById(req.params.id).lean();
  if (!item) throw new ApiError(404, "Exam session not found.");
  return ok(res, item);
}

export async function createExamSession(req, res) {
  const settings = await SystemSetting.findOne({ key: "global" }).lean();
  const payload = { ...req.body };
  if (!payload.seatingRules && settings) {
    payload.seatingRules = {
      minGap: settings.minGapBetweenSameSubject,
      backlogMode: settings.defaultBacklogMode,
    };
  }
  const item = await ExamSession.create(payload);
  return ok(res, item, "Exam session created.", 201);
}

export async function updateExamSession(req, res) {
  const item = await ExamSession.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) throw new ApiError(404, "Exam session not found.");
  return ok(res, item, "Exam session updated.");
}

export async function deleteExamSession(req, res) {
  const item = await ExamSession.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, "Exam session not found.");

  await Promise.all([
    Timetable.deleteMany({ examSession: item._id }),
    SeatingArrangement.deleteMany({ examSession: item._id }),
  ]);
  return ok(
    res,
    { id: item._id },
    "Exam session and generated artifacts deleted.",
  );
}

export async function listTimetable(req, res) {
  const filter = {};
  if (req.query.examSessionId) filter.examSession = req.query.examSessionId;
  if (req.query.date) filter.date = new Date(req.query.date);
  if (req.query.slotLabel) filter.slotLabel = req.query.slotLabel;

  const rows = await Timetable.find(filter)
    .populate({
      path: "subject",
      populate: [
        { path: "department" },
        { path: "semester" },
        { path: "course" },
      ],
    })
    .populate("examSession")
    .sort({ date: 1, startTime: 1 })
    .lean();
  return ok(res, rows);
}

export async function timetableSubjects(req, res) {
  if (!(await ExamSession.exists({ _id: req.params.sessionId }))) {
    throw new ApiError(404, "Exam session not found.");
  }
  const subjects = await Subject.find()
    .populate("department semester course")
    .sort({ code: 1 })
    .lean();
  return ok(res, subjects);
}

export async function generateTimetable(req, res) {
  const { examSessionId, subjectIds } = req.body;
  if (!examSessionId || !Array.isArray(subjectIds) || !subjectIds.length) {
    throw new ApiError(
      422,
      "examSessionId and a non-empty subjectIds array are required.",
    );
  }
  const rows = await runTimetableGenerator(examSessionId, subjectIds);
  return ok(res, rows, "Conflict-free timetable generated.", 201);
}

export async function updateTimetable(req, res) {
  return ok(
    res,
    await manualMove(req.params.id, req.body),
    "Timetable entry updated.",
  );
}

export async function deleteTimetable(req, res) {
  const row = await Timetable.findByIdAndDelete(req.params.id);
  if (!row) throw new ApiError(404, "Timetable entry not found.");
  return ok(res, { id: row._id }, "Timetable entry deleted.");
}

export async function listSeating(req, res) {
  const filter = {};
  if (req.query.examSessionId) filter.examSession = req.query.examSessionId;
  if (req.query.date) filter.date = new Date(req.query.date);
  if (req.query.slotLabel) filter.timeSlot = req.query.slotLabel;

  const rows = await SeatingArrangement.find(filter)
    .populate("classroom examSession")
    .sort({ date: 1, timeSlot: 1 })
    .lean();
  return ok(res, rows);
}

export async function generateSeating(req, res) {
  const { examSessionId, date, slotLabel, classroomIds } = req.body;
  if (
    !examSessionId ||
    !date ||
    !slotLabel ||
    !Array.isArray(classroomIds) ||
    !classroomIds.length
  ) {
    throw new ApiError(
      422,
      "examSessionId, date, slotLabel and classroomIds are required.",
    );
  }
  const rows = await runSeatingGenerator({ ...req.body, userId: req.user._id });
  return ok(res, rows, "Conflict-free seating generated.", 201);
}

export async function markAttendance(req, res) {
  const { seatNo, attendance } = req.body;
  if (!["present", "absent", "unmarked"].includes(attendance)) {
    throw new ApiError(422, "Invalid attendance value.");
  }

  const arrangement = await SeatingArrangement.findById(req.params.id);
  if (!arrangement) throw new ApiError(404, "Seating arrangement not found.");
  const seat = arrangement.seatMap.find((item) => item.seatNo === seatNo);
  if (!seat?.studentId) throw new ApiError(404, "Occupied seat not found.");

  seat.attendance = attendance;
  await arrangement.save();
  return ok(res, { seatNo, attendance }, "Attendance updated.");
}

export async function deleteSeating(req, res) {
  const item = await SeatingArrangement.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, "Seating arrangement not found.");
  return ok(res, { id: item._id }, "Seating arrangement deleted.");
}

export async function getSettings(_req, res) {
  const settings = await SystemSetting.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global" } },
    { new: true, upsert: true },
  ).lean();
  return ok(res, settings);
}

export async function updateSettings(req, res) {
  const settings = await SystemSetting.findOneAndUpdate(
    { key: "global" },
    { $set: req.body, $setOnInsert: { key: "global" } },
    { new: true, upsert: true, runValidators: true },
  );
  return ok(res, settings, "Settings updated.");
}
