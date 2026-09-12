import { ExamSession, Subject, Timetable } from "../models/index.js";
import { ApiError, dateOnly, examDays, isoDate } from "../utils/http.js";
import { appearances, intersects, sets } from "./appearances.js";

function departmentId(subject) {
  return String(subject.department?._id || subject.department || "");
}

function sameDepartmentBackToBackPenalty(subject, slot, placed) {
  return placed.reduce((penalty, existing) => {
    const sameDay = isoDate(existing.date) === isoDate(slot.date);
    const sameDepartment =
      departmentId(existing.subject) === departmentId(subject);
    const adjacentSlot = Math.abs(existing.slotIndex - slot.slotIndex) === 1;
    return penalty + (sameDay && sameDepartment && adjacentSlot ? 10 : 0);
  }, 0);
}

/**
 * Graph-coloring style timetable generation.
 * Each subject is a vertex. Two subjects are connected when any student is
 * registered to appear for both. Connected subjects may never share a slot.
 */
export async function generateTimetable(examSessionId, subjectIds) {
  const session = await ExamSession.findById(examSessionId).lean();
  if (!session) throw new ApiError(404, "Exam session not found.");

  const subjects = await Subject.find({ _id: { $in: subjectIds } })
    .populate("department", "name code")
    .lean();
  if (subjects.length !== subjectIds.length) {
    throw new ApiError(422, "One or more subject IDs are invalid.");
  }

  const days = examDays(
    session.startDate,
    session.endDate,
    session.excludedDates,
  );
  if (!days.length || !session.timeSlots?.length) {
    throw new ApiError(422, "No available exam day/time slot is configured.");
  }

  const slots = [];
  for (const date of days) {
    session.timeSlots.forEach((timeSlot, slotIndex) => {
      slots.push({ date, slotIndex, ...timeSlot });
    });
  }

  // This is the important backlog-safe step: resolve actual appearances,
  // instead of assuming a student's current semester defines every exam.
  const appearanceRows = await appearances(subjectIds, session.academicYear);
  const subjectStudents = sets(appearanceRows);

  const conflicts = new Map(
    subjects.map((subject) => [String(subject._id), new Set()]),
  );
  for (let first = 0; first < subjects.length; first += 1) {
    for (let second = first + 1; second < subjects.length; second += 1) {
      const a = String(subjects[first]._id);
      const b = String(subjects[second]._id);
      if (intersects(subjectStudents.get(a), subjectStudents.get(b))) {
        conflicts.get(a).add(b);
        conflicts.get(b).add(a);
      }
    }
  }

  // Most constrained subjects first generally reduces dead ends.
  const orderedSubjects = [...subjects].sort((a, b) => {
    const conflictDifference =
      conflicts.get(String(b._id)).size - conflicts.get(String(a._id)).size;
    if (conflictDifference !== 0) return conflictDifference;

    const aCount = subjectStudents.get(String(a._id))?.size || 0;
    const bCount = subjectStudents.get(String(b._id))?.size || 0;
    return bCount - aCount;
  });

  const placed = [];
  for (const subject of orderedSubjects) {
    const subjectId = String(subject._id);

    const candidates = slots
      .filter(
        (slot) =>
          !placed.some((existing) => {
            const sameSlot =
              isoDate(existing.date) === isoDate(slot.date) &&
              existing.slotIndex === slot.slotIndex;
            return (
              sameSlot &&
              conflicts.get(subjectId).has(String(existing.subject._id))
            );
          }),
      )
      .map((slot) => ({
        slot,
        penalty: sameDepartmentBackToBackPenalty(subject, slot, placed),
      }))
      .sort(
        (a, b) =>
          a.penalty - b.penalty ||
          a.slot.date - b.slot.date ||
          a.slot.slotIndex - b.slot.slotIndex,
      );

    if (!candidates.length) {
      throw new ApiError(
        422,
        `Unable to place ${subject.code} without a student conflict. Add exam days/time slots.`,
      );
    }

    placed.push({ ...candidates[0].slot, subject });
  }

  await Timetable.deleteMany({
    examSession: session._id,
    subject: { $in: subjectIds },
  });
  await Timetable.insertMany(
    placed.map((item) => ({
      examSession: session._id,
      subject: item.subject._id,
      date: item.date,
      slotLabel: item.label,
      startTime: item.startTime,
      endTime: item.endTime,
      duration: item.subject.duration || 120,
      manualOverride: false,
    })),
  );

  return Timetable.find({ examSession: session._id })
    .populate({
      path: "subject",
      populate: [
        { path: "department" },
        { path: "semester" },
        { path: "course" },
      ],
    })
    .sort({ date: 1, startTime: 1 })
    .lean();
}

/**
 * Manual edits are allowed only after checking every student appearance
 * already scheduled in the destination slot.
 */
export async function manualMove(id, patch) {
  const row = await Timetable.findById(id);
  if (!row) throw new ApiError(404, "Timetable entry not found.");

  const session = await ExamSession.findById(row.examSession).lean();
  const targetDate = dateOnly(patch.date || row.date);
  const targetSlot = patch.slotLabel || row.slotLabel;
  if (!targetDate)
    throw new ApiError(422, "A valid timetable date is required.");

  const otherRows = await Timetable.find({
    _id: { $ne: row._id },
    examSession: row.examSession,
    date: targetDate,
    slotLabel: targetSlot,
  })
    .select("subject")
    .lean();

  if (otherRows.length) {
    const subjectIds = [row.subject, ...otherRows.map((item) => item.subject)];
    const subjectStudents = sets(
      await appearances(subjectIds, session.academicYear),
    );

    for (const other of otherRows) {
      if (
        intersects(
          subjectStudents.get(String(row.subject)),
          subjectStudents.get(String(other.subject)),
        )
      ) {
        throw new ApiError(
          409,
          "Manual move would give a student two exams in the same slot.",
        );
      }
    }
  }

  Object.assign(row, patch, { date: targetDate, manualOverride: true });
  await row.save();
  return row.populate("subject", "name code");
}
