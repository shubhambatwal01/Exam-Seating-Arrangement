import {
  Classroom,
  ExamSession,
  SeatingArrangement,
  Timetable,
} from "../models/index.js";
import { ApiError, dateOnly } from "../utils/http.js";
import { appearances } from "./appearances.js";

function coordinates(room) {
  const seats = [];
  for (let row = 1; row <= room.rows; row += 1) {
    for (
      let col = 1;
      col <= room.columns && seats.length < room.capacity;
      col += 1
    ) {
      seats.push({
        row,
        col,
        seatNo: `${room.roomNo}-${String(seats.length + 1).padStart(2, "0")}`,
      });
    }
  }
  return seats;
}

function canPlace(subjectCode, index, seats, assigned, minGap) {
  if (!subjectCode) return true;
  const current = seats[index];
  const enforcedGap = Math.max(1, Number(minGap) || 0); // adjacency is always forbidden

  for (let priorIndex = 0; priorIndex < index; priorIndex += 1) {
    if (assigned[priorIndex]?.subjectCode !== subjectCode) continue;
    const prior = seats[priorIndex];
    const manhattan =
      Math.abs(current.row - prior.row) + Math.abs(current.col - prior.col);
    if (manhattan <= enforcedGap) return false;
  }
  return true;
}

function toGroups(items, subjectCodeById) {
  const groups = new Map();
  for (const item of items) {
    const subjectCode = subjectCodeById.get(item.subjectId);
    if (!groups.has(subjectCode)) groups.set(subjectCode, []);
    groups.get(subjectCode).push({ ...item, subjectCode });
  }
  return groups;
}

function remaining(groups) {
  return [...groups.values()].reduce((total, queue) => total + queue.length, 0);
}

function fillRoom(room, groups, minGap, intersperseAppearances = false) {
  const seats = coordinates(room);
  const assigned = new Array(seats.length).fill(null);

  for (let index = 0; index < seats.length; index += 1) {
    const choices = [...groups.entries()]
      .filter(([, queue]) => queue.length)
      .filter(([subjectCode]) =>
        canPlace(subjectCode, index, seats, assigned, minGap),
      )
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

    if (!choices.length) continue; // preserve the conflict rule by leaving a physical seat empty

    const queue = choices[0][1];
    let queueIndex = 0;
    if (intersperseAppearances) {
      const preferredType = index % 2 === 0 ? "fresh" : "backlog";
      const matchingIndex = queue.findIndex(
        (item) => item.appearanceType === preferredType,
      );
      if (matchingIndex >= 0) queueIndex = matchingIndex;
    }
    assigned[index] = queue.splice(queueIndex, 1)[0];
  }

  return seats.map((seat, index) => {
    const person = assigned[index];
    return person
      ? { ...seat, ...person, attendance: "unmarked" }
      : {
          ...seat,
          studentId: null,
          rollNo: "",
          studentName: "",
          subjectCode: "",
          appearanceType: "empty",
          attendance: "unmarked",
        };
  });
}

export async function generateSeating({
  examSessionId,
  date,
  slotLabel,
  classroomIds,
  backlogMode,
  minGap,
  userId,
}) {
  const session = await ExamSession.findById(examSessionId).lean();
  if (!session) throw new ApiError(404, "Exam session not found.");

  const examDate = dateOnly(date);
  if (!examDate) throw new ApiError(422, "A valid exam date is required.");

  const timetableRows = await Timetable.find({
    examSession: examSessionId,
    date: examDate,
    slotLabel,
  })
    .populate("subject", "code")
    .lean();
  if (!timetableRows.length) {
    throw new ApiError(
      422,
      "No timetable subjects exist for this date and slot.",
    );
  }

  const subjectIds = timetableRows.map((row) => row.subject._id);
  const subjectCodeById = new Map(
    timetableRows.map((row) => [String(row.subject._id), row.subject.code]),
  );
  const candidateAppearances = await appearances(
    subjectIds,
    session.academicYear,
  );

  const appearancesByStudent = new Map();
  for (const item of candidateAppearances) {
    const list = appearancesByStudent.get(item.studentId) || [];
    list.push(item);
    appearancesByStudent.set(item.studentId, list);
  }
  if ([...appearancesByStudent.values()].some((items) => items.length > 1)) {
    throw new ApiError(
      409,
      "A student has multiple subjects in this slot. Fix the timetable before generating seating.",
    );
  }

  const rooms = await Classroom.find({
    _id: { $in: classroomIds },
    active: true,
  })
    .sort({ roomNo: 1 })
    .lean();
  if (!rooms.length)
    throw new ApiError(422, "Select at least one active classroom.");

  const rawCapacity = rooms.reduce((total, room) => total + room.capacity, 0);
  if (candidateAppearances.length > rawCapacity) {
    throw new ApiError(
      422,
      `Selected classroom capacity is insufficient: ${candidateAppearances.length} students for ${rawCapacity} seats.`,
    );
  }

  const mode =
    backlogMode || session.seatingRules?.backlogMode || "intersperse";
  const gap = Number.isFinite(Number(minGap))
    ? Number(minGap)
    : Number(session.seatingRules?.minGap ?? 1);
  const documents = [];

  if (mode === "separate") {
    // "Separate" means fresh and backlog candidates are assigned to different halls.
    // A room is never switched from one pool to the other after seating starts.
    const freshGroups = toGroups(
      candidateAppearances.filter((item) => item.appearanceType === "fresh"),
      subjectCodeById,
    );
    const backlogGroups = toGroups(
      candidateAppearances.filter((item) => item.appearanceType === "backlog"),
      subjectCodeById,
    );

    for (const room of rooms) {
      let seatMap;
      if (remaining(freshGroups) > 0)
        seatMap = fillRoom(room, freshGroups, gap, false);
      else if (remaining(backlogGroups) > 0)
        seatMap = fillRoom(room, backlogGroups, gap, false);
      else seatMap = fillRoom(room, new Map(), gap, false);

      documents.push({
        examSession: session._id,
        classroom: room._id,
        date: examDate,
        timeSlot: slotLabel,
        seatMap,
        generatedBy: userId,
      });
    }

    const unseated = remaining(freshGroups) + remaining(backlogGroups);
    if (unseated) {
      throw new ApiError(
        422,
        `${unseated} student(s) could not be seated while keeping fresh/backlog halls separate and preserving the subject-gap rule. Add classrooms or use intersperse mode.`,
      );
    }
  } else {
    const groups = toGroups(candidateAppearances, subjectCodeById);
    for (const room of rooms) {
      documents.push({
        examSession: session._id,
        classroom: room._id,
        date: examDate,
        timeSlot: slotLabel,
        seatMap: fillRoom(room, groups, gap, true),
        generatedBy: userId,
      });
    }

    const unseated = remaining(groups);
    if (unseated) {
      throw new ApiError(
        422,
        `${unseated} student(s) could not be seated without adjacent same-subject seats. Add classrooms or reduce the configured gap.`,
      );
    }
  }

  await SeatingArrangement.deleteMany({
    examSession: session._id,
    date: examDate,
    timeSlot: slotLabel,
    classroom: { $in: rooms.map((room) => room._id) },
  });
  await SeatingArrangement.insertMany(documents);

  return SeatingArrangement.find({
    examSession: session._id,
    date: examDate,
    timeSlot: slotLabel,
    classroom: { $in: rooms.map((room) => room._id) },
  })
    .populate("classroom")
    .lean();
}
