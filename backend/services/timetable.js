import { ExamSession, Subject, Timetable } from "../models/index.js";
import { ApiError, dateOnly, examDays, isoDate } from "../utils/http.js";
import { appearances, intersects, sets } from "./appearances.js";

function refId(value) {
  return String(value?._id || value || "");
}

function placementPenalty(subject, subjectId, slot, placed, conflicts) {
  let penalty = 0;

  for (const existing of placed) {
    const sameDay = isoDate(existing.date) === isoDate(slot.date);
    const sameSlot = sameDay && existing.slotIndex === slot.slotIndex;
    const sameDepartment =
      refId(existing.subject.department) === refId(subject.department);
    const sameCourse = refId(existing.subject.course) === refId(subject.course);
    const sameSemester =
      refId(existing.subject.semester) === refId(subject.semester);
    const adjacentSlot = Math.abs(existing.slotIndex - slot.slotIndex) === 1;
    const studentsOverlap = conflicts
      .get(subjectId)
      ?.has(String(existing.subject._id));

    // Keep the same class/semester spread across different examination days
    // whenever the configured date range makes that possible.
    if (sameDay && sameCourse && sameSemester) penalty += 80;

    // Backlog-aware: if two subjects share one or more candidates, strongly
    // prefer different days even though a different time slot is technically
    // conflict-free.
    if (sameDay && studentsOverlap) penalty += 60;

    // Match the college's timetable style by avoiding consecutive papers from
    // the same department and by balancing each slot.
    if (sameDay && sameDepartment && adjacentSlot) penalty += 18;
    else if (sameDay && sameDepartment) penalty += 6;

    if (sameSlot) penalty += 2;
  }

  return penalty;
}

/**
 * Conflict-aware timetable generation.
 *
 * Hard rule: subjects sharing any candidate can never occupy the same slot.
 * Soft preferences: spread the same class/semester and shared-candidate papers
 * across days, avoid back-to-back same-department papers, and balance slots.
 */
export async function generateTimetable(examSessionId, subjectIds) {
  const session = await ExamSession.findById(examSessionId).lean();
  if (!session) throw new ApiError(404, "Exam session not found.");

  const uniqueSubjectIds = [...new Set(subjectIds.map(String))];
  const subjects = await Subject.find({ _id: { $in: uniqueSubjectIds } })
    .populate("department", "name code")
    .populate("course", "name code")
    .populate("semester", "number")
    .lean();

  if (subjects.length !== uniqueSubjectIds.length) {
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

  // Resolve real fresh + backlog appearances. A student's current semester is
  // never used as a substitute for the paper they are actually appearing for.
  const appearanceRows = await appearances(
    uniqueSubjectIds,
    session.academicYear,
  );
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

  // Most constrained/highest-strength subjects first reduces dead ends and
  // gives the formation a stable, predictable ordering.
  const orderedSubjects = [...subjects].sort((a, b) => {
    const conflictDifference =
      conflicts.get(String(b._id)).size - conflicts.get(String(a._id)).size;
    if (conflictDifference !== 0) return conflictDifference;

    const aCount = subjectStudents.get(String(a._id))?.size || 0;
    const bCount = subjectStudents.get(String(b._id))?.size || 0;
    if (bCount !== aCount) return bCount - aCount;

    return a.code.localeCompare(b.code);
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
        penalty: placementPenalty(subject, subjectId, slot, placed, conflicts),
        slotLoad: placed.filter(
          (existing) =>
            isoDate(existing.date) === isoDate(slot.date) &&
            existing.slotIndex === slot.slotIndex,
        ).length,
        dayLoad: placed.filter(
          (existing) => isoDate(existing.date) === isoDate(slot.date),
        ).length,
      }))
      .sort(
        (a, b) =>
          a.penalty - b.penalty ||
          a.slotLoad - b.slotLoad ||
          a.dayLoad - b.dayLoad ||
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
    subject: { $in: uniqueSubjectIds },
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
 * Manual edits remain protected by the hard same-slot appearance rule.
 */
export async function manualMove(id, patch) {
  const row = await Timetable.findById(id);
  if (!row) throw new ApiError(404, "Timetable entry not found.");

  const session = await ExamSession.findById(row.examSession).lean();
  const targetDate = dateOnly(patch.date || row.date);
  const targetSlot = patch.slotLabel || row.slotLabel;
  if (!targetDate)
    throw new ApiError(422, "A valid timetable date is required.");

  const configuredSlot = session?.timeSlots?.find(
    (item) => item.label === targetSlot,
  );
  if (configuredSlot) {
    patch.startTime = configuredSlot.startTime;
    patch.endTime = configuredSlot.endTime;
  }

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
