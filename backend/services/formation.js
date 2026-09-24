import { ExamSession, SeatingArrangement, Timetable } from "../models/index.js";
import { ApiError, isoDate } from "../utils/http.js";
import { appearances } from "./appearances.js";

export function romanSemester(value) {
  const numbers = [
    "",
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  return numbers[Number(value)] || String(value || "-");
}

export function formatDisplayDate(value) {
  const raw = isoDate(value);
  if (!raw) return "";
  const [year, month, day] = raw.split("-");
  return `${day}.${month}.${year}`;
}

function roomName(arrangement) {
  return arrangement.classroom?.roomNo || "-";
}

function allocationKey(date, slot, room, subjectCode) {
  return `${isoDate(date)}|${slot}|${room}|${subjectCode}`;
}

/**
 * Build the institutional timetable/room-allocation formation used by the
 * UI and printable reports.  A timetable subject can expand into multiple
 * rows when its students are split across multiple blocks/rooms.
 */
export async function buildTimetableFormation(examSessionId) {
  const session = await ExamSession.findById(examSessionId).lean();
  if (!session) throw new ApiError(404, "Exam session not found.");

  const timetable = await Timetable.find({ examSession: examSessionId })
    .populate({
      path: "subject",
      populate: [
        { path: "department", select: "name code" },
        { path: "course", select: "name code" },
        { path: "semester", select: "number" },
      ],
    })
    .sort({ date: 1, startTime: 1 })
    .lean();

  if (!timetable.length) {
    return { session, rows: [] };
  }

  const subjectIds = timetable.map((row) => row.subject?._id).filter(Boolean);
  const appearanceRows = await appearances(subjectIds, session.academicYear);

  const counts = new Map();
  for (const item of appearanceRows) {
    const current = counts.get(item.subjectId) || {
      total: 0,
      fresh: 0,
      backlog: 0,
    };
    current.total += 1;
    current[item.appearanceType] += 1;
    counts.set(item.subjectId, current);
  }

  const arrangements = await SeatingArrangement.find({
    examSession: examSessionId,
  })
    .populate("classroom", "roomNo building capacity")
    .lean();

  arrangements.sort((a, b) => {
    const dateCompare = isoDate(a.date).localeCompare(isoDate(b.date));
    if (dateCompare) return dateCompare;
    const slotCompare = String(a.timeSlot).localeCompare(String(b.timeSlot));
    if (slotCompare) return slotCompare;
    return roomName(a).localeCompare(roomName(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  // Block numbers are assigned in the same way the supplied college skeleton
  // is laid out: every non-empty room+subject allocation gets a sequential
  // block number for that date/session.
  const allocations = new Map();
  let previousGroup = "";
  let blockNo = 0;

  for (const arrangement of arrangements) {
    const groupKey = `${isoDate(arrangement.date)}|${arrangement.timeSlot}`;
    if (groupKey !== previousGroup) {
      previousGroup = groupKey;
      blockNo = 0;
    }

    const bySubject = new Map();
    for (const seat of arrangement.seatMap || []) {
      if (!seat.studentId || !seat.subjectCode) continue;
      bySubject.set(
        seat.subjectCode,
        (bySubject.get(seat.subjectCode) || 0) + 1,
      );
    }

    for (const [subjectCode, strength] of [...bySubject.entries()].sort(
      (a, b) => a[0].localeCompare(b[0]),
    )) {
      blockNo += 1;
      allocations.set(
        allocationKey(
          arrangement.date,
          arrangement.timeSlot,
          roomName(arrangement),
          subjectCode,
        ),
        {
          blockNo,
          roomNo: roomName(arrangement),
          building: arrangement.classroom?.building || "",
          strength,
        },
      );
    }
  }

  const rows = [];
  for (const row of timetable) {
    if (!row.subject) continue;
    const code = row.subject.code;
    const subjectCount = counts.get(String(row.subject._id)) || {
      total: 0,
      fresh: 0,
      backlog: 0,
    };

    const matching = [];
    for (const [key, allocation] of allocations.entries()) {
      const [date, slot, room, subjectCode] = key.split("|");
      if (
        date === isoDate(row.date) &&
        slot === row.slotLabel &&
        subjectCode === code
      ) {
        matching.push({ ...allocation, roomNo: room });
      }
    }

    matching.sort((a, b) => a.blockNo - b.blockNo);

    const base = {
      timetableId: row._id,
      examSessionId: row.examSession,
      date: row.date,
      isoDate: isoDate(row.date),
      displayDate: formatDisplayDate(row.date),
      slotLabel: row.slotLabel,
      startTime: row.startTime,
      endTime: row.endTime,
      manualOverride: row.manualOverride,
      className: row.subject.course?.name || row.subject.course?.code || "-",
      courseCode: row.subject.course?.code || "",
      department: row.subject.department?.name || "",
      departmentCode: row.subject.department?.code || "",
      semester: row.subject.semester?.number || "",
      semesterRoman: romanSemester(row.subject.semester?.number),
      subjectCode: code,
      subjectName: row.subject.name,
      strength: subjectCount.total,
      freshStrength: subjectCount.fresh,
      backlogStrength: subjectCount.backlog,
    };

    if (!matching.length) {
      rows.push({
        ...base,
        allocationStrength: subjectCount.total,
        blockNo: "-",
        roomNo: "-",
        building: "",
        seatingGenerated: false,
      });
      continue;
    }

    for (const allocation of matching) {
      rows.push({
        ...base,
        allocationStrength: allocation.strength,
        blockNo: allocation.blockNo,
        roomNo: allocation.roomNo,
        building: allocation.building,
        seatingGenerated: true,
      });
    }

    const allocated = matching.reduce((sum, item) => sum + item.strength, 0);
    if (allocated < subjectCount.total) {
      rows.push({
        ...base,
        allocationStrength: subjectCount.total - allocated,
        blockNo: "-",
        roomNo: "Unallocated",
        building: "",
        seatingGenerated: false,
      });
    }
  }

  rows.sort(
    (a, b) =>
      a.isoDate.localeCompare(b.isoDate) ||
      a.startTime.localeCompare(b.startTime) ||
      String(a.blockNo).localeCompare(String(b.blockNo), undefined, {
        numeric: true,
      }) ||
      a.subjectCode.localeCompare(b.subjectCode),
  );

  return { session, rows };
}
