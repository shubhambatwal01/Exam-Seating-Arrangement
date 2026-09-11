import { Router } from "express";
import {
  ExamSession,
  SeatingArrangement,
  Subject,
  SystemSetting,
  Timetable,
} from "../models/index.js";
import { permit, requireAuth } from "../middleware/auth.js";
import { generateSeating } from "../services/seating.js";
import { generateTimetable, manualMove } from "../services/timetable.js";
import { ApiError, asyncHandler, ok } from "../utils/http.js";

const router = Router();
router.use(requireAuth);

// Exam sessions
router.get(
  "/exam-sessions",
  asyncHandler(async (_req, res) => {
    ok(res, await ExamSession.find().sort({ startDate: -1 }).lean());
  }),
);

router.get(
  "/exam-sessions/:id",
  asyncHandler(async (req, res) => {
    const item = await ExamSession.findById(req.params.id).lean();
    if (!item) throw new ApiError(404, "Exam session not found.");
    ok(res, item);
  }),
);

router.post(
  "/exam-sessions",
  permit("admin"),
  asyncHandler(async (req, res) => {
    const settings = await SystemSetting.findOne({ key: "global" }).lean();
    const payload = { ...req.body };
    if (!payload.seatingRules && settings) {
      payload.seatingRules = {
        minGap: settings.minGapBetweenSameSubject,
        backlogMode: settings.defaultBacklogMode,
      };
    }
    const item = await ExamSession.create(payload);
    ok(res, item, "Exam session created.", 201);
  }),
);

router.patch(
  "/exam-sessions/:id",
  permit("admin"),
  asyncHandler(async (req, res) => {
    const item = await ExamSession.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) throw new ApiError(404, "Exam session not found.");
    ok(res, item, "Exam session updated.");
  }),
);

router.delete(
  "/exam-sessions/:id",
  permit("admin"),
  asyncHandler(async (req, res) => {
    const item = await ExamSession.findByIdAndDelete(req.params.id);
    if (!item) throw new ApiError(404, "Exam session not found.");
    await Promise.all([
      Timetable.deleteMany({ examSession: item._id }),
      SeatingArrangement.deleteMany({ examSession: item._id }),
    ]);
    ok(res, { id: item._id }, "Exam session and generated artifacts deleted.");
  }),
);

// Timetable
router.get(
  "/timetable",
  asyncHandler(async (req, res) => {
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
    ok(res, rows);
  }),
);

router.get(
  "/timetable/subjects/:sessionId",
  asyncHandler(async (req, res) => {
    const sessionExists = await ExamSession.exists({
      _id: req.params.sessionId,
    });
    if (!sessionExists) throw new ApiError(404, "Exam session not found.");
    const subjects = await Subject.find()
      .populate("department semester course")
      .sort({ code: 1 })
      .lean();
    ok(res, subjects);
  }),
);

router.post(
  "/timetable/generate",
  permit("admin"),
  asyncHandler(async (req, res) => {
    const { examSessionId, subjectIds } = req.body;
    if (!examSessionId || !Array.isArray(subjectIds) || !subjectIds.length) {
      throw new ApiError(
        422,
        "examSessionId and a non-empty subjectIds array are required.",
      );
    }
    const rows = await generateTimetable(examSessionId, subjectIds);
    ok(res, rows, "Conflict-free timetable generated.", 201);
  }),
);

router.patch(
  "/timetable/:id",
  permit("admin"),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await manualMove(req.params.id, req.body),
      "Timetable entry updated.",
    );
  }),
);

router.delete(
  "/timetable/:id",
  permit("admin"),
  asyncHandler(async (req, res) => {
    const row = await Timetable.findByIdAndDelete(req.params.id);
    if (!row) throw new ApiError(404, "Timetable entry not found.");
    ok(res, { id: row._id }, "Timetable entry deleted.");
  }),
);

// Seating
router.get(
  "/seating",
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.examSessionId) filter.examSession = req.query.examSessionId;
    if (req.query.date) filter.date = new Date(req.query.date);
    if (req.query.slotLabel) filter.timeSlot = req.query.slotLabel;

    const rows = await SeatingArrangement.find(filter)
      .populate("classroom examSession")
      .sort({ date: 1, timeSlot: 1 })
      .lean();
    ok(res, rows);
  }),
);

router.post(
  "/seating/generate",
  permit("admin"),
  asyncHandler(async (req, res) => {
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
    const rows = await generateSeating({ ...req.body, userId: req.user._id });
    ok(res, rows, "Conflict-free seating generated.", 201);
  }),
);

router.patch(
  "/seating/:id/attendance",
  permit("admin", "staff"),
  asyncHandler(async (req, res) => {
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
    ok(res, { seatNo, attendance }, "Attendance updated.");
  }),
);

router.delete(
  "/seating/:id",
  permit("admin"),
  asyncHandler(async (req, res) => {
    const item = await SeatingArrangement.findByIdAndDelete(req.params.id);
    if (!item) throw new ApiError(404, "Seating arrangement not found.");
    ok(res, { id: item._id }, "Seating arrangement deleted.");
  }),
);

// Global settings
router.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const settings = await SystemSetting.findOneAndUpdate(
      { key: "global" },
      { $setOnInsert: { key: "global" } },
      { new: true, upsert: true },
    ).lean();
    ok(res, settings);
  }),
);

router.patch(
  "/settings",
  permit("admin"),
  asyncHandler(async (req, res) => {
    const settings = await SystemSetting.findOneAndUpdate(
      { key: "global" },
      { $set: req.body, $setOnInsert: { key: "global" } },
      { new: true, upsert: true, runValidators: true },
    );
    ok(res, settings, "Settings updated.");
  }),
);

export default router;
