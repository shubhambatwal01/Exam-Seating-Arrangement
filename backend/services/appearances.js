import { BacklogRegistration, Student } from "../models/index.js";

/**
 * Resolve the actual subject each student is appearing for.
 * Fresh/current and backlog appearances are intentionally separate sources.
 */
export async function appearances(subjectIds, academicYear) {
  const targetIds = new Set(subjectIds.map(String));

  const freshStudents = await Student.find({
    active: true,
    subjects: { $in: subjectIds },
  })
    .select("rollNo name subjects")
    .lean();

  const rows = [];
  for (const student of freshStudents) {
    for (const subject of student.subjects) {
      if (!targetIds.has(String(subject))) continue;
      rows.push({
        studentId: String(student._id),
        rollNo: student.rollNo,
        studentName: student.name,
        subjectId: String(subject),
        appearanceType: "fresh",
      });
    }
  }

  const backlogRows = await BacklogRegistration.find({
    subject: { $in: subjectIds },
    academicYear,
    status: "registered",
  })
    .populate("student", "rollNo name active")
    .lean();

  for (const registration of backlogRows) {
    if (!registration.student || registration.student.active === false)
      continue;
    rows.push({
      studentId: String(registration.student._id),
      rollNo: registration.student.rollNo,
      studentName: registration.student.name,
      subjectId: String(registration.subject),
      appearanceType: "backlog",
    });
  }

  // Same student+subject can exist only once in the appearance set.
  return [
    ...new Map(
      rows.map((row) => [`${row.studentId}:${row.subjectId}`, row]),
    ).values(),
  ];
}

export function sets(rows) {
  const result = new Map();
  for (const row of rows) {
    if (!result.has(row.subjectId)) result.set(row.subjectId, new Set());
    result.get(row.subjectId).add(row.studentId);
  }
  return result;
}

export function intersects(a = new Set(), b = new Set()) {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const value of small) if (large.has(value)) return true;
  return false;
}
