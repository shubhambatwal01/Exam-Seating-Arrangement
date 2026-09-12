import ExcelJS from "exceljs";
import {
  BacklogRegistration,
  Course,
  Department,
  Semester,
  Student,
  Subject,
} from "../models/index.js";
import { ApiError } from "../utils/http.js";

const cellText = (cell) => String(cell?.text ?? cell?.value ?? "").trim();
const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();
const splitCodes = (value) =>
  String(value || "")
    .split(/[;,|]/)
    .map(normalizeCode)
    .filter(Boolean);

function findColumn(headers, aliases) {
  return aliases.map((alias) => headers[alias]).find(Boolean);
}

export async function parseWorkbook(buffer, academicYear = "") {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new ApiError(400, "Invalid .xlsx workbook.");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ApiError(400, "Workbook has no worksheet.");

  const headers = {};
  sheet.getRow(1).eachCell((cell, columnNumber) => {
    headers[cellText(cell).toLowerCase()] = columnNumber;
  });

  const columns = {
    rollNo: findColumn(headers, ["roll no", "rollno", "roll_no"]),
    name: findColumn(headers, ["name", "student name"]),
    department: findColumn(headers, [
      "department code",
      "department",
      "dept code",
    ]),
    course: findColumn(headers, ["course code", "course"]),
    semester: findColumn(headers, ["semester", "sem"]),
    subjects: findColumn(headers, [
      "subject codes",
      "subjects",
      "subject code",
    ]),
    freshSubjects: findColumn(headers, [
      "fresh subject codes",
      "current subject codes",
    ]),
    backlogSubjects: findColumn(headers, [
      "backlog subject codes",
      "backlog subjects",
    ]),
    type: findColumn(headers, ["type", "fresh/backlog", "student type"]),
    email: findColumn(headers, ["email", "student email"]),
  };

  const required = [
    "rollNo",
    "name",
    "department",
    "course",
    "semester",
    "type",
  ];
  const missing = required.filter((key) => !columns[key]);
  if (!columns.subjects && !columns.freshSubjects && !columns.backlogSubjects) {
    missing.push("subject codes");
  }
  if (missing.length) {
    throw new ApiError(
      422,
      `Missing required Excel columns: ${missing.join(", ")}.`,
    );
  }

  const [departments, courses, semesters, subjects, existingStudents] =
    await Promise.all([
      Department.find().lean(),
      Course.find().lean(),
      Semester.find().lean(),
      Subject.find().lean(),
      Student.find().select("rollNo").lean(),
    ]);

  const departmentByCode = new Map(
    departments.map((item) => [normalizeCode(item.code), item]),
  );
  const courseByCode = new Map(
    courses.map((item) => [normalizeCode(item.code), item]),
  );
  const semesterByKey = new Map(
    semesters.map((item) => [`${item.course}:${item.number}`, item]),
  );
  const subjectByCode = new Map(
    subjects.map((item) => [normalizeCode(item.code), item]),
  );
  const existingRollNos = new Set(
    existingStudents.map((item) => normalizeCode(item.rollNo)),
  );
  const seenRollNos = new Set();

  const rows = [];
  const errors = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const rollNo = normalizeCode(cellText(row.getCell(columns.rollNo)));
    const name = cellText(row.getCell(columns.name));
    const departmentCode = normalizeCode(
      cellText(row.getCell(columns.department)),
    );
    const courseCode = normalizeCode(cellText(row.getCell(columns.course)));
    const semesterNumber = Number(cellText(row.getCell(columns.semester)));
    const type = cellText(row.getCell(columns.type)).toLowerCase();
    const email = columns.email
      ? cellText(row.getCell(columns.email)).toLowerCase()
      : "";

    const generalCodes = columns.subjects
      ? splitCodes(cellText(row.getCell(columns.subjects)))
      : [];
    let freshSubjectCodes = columns.freshSubjects
      ? splitCodes(cellText(row.getCell(columns.freshSubjects)))
      : [];
    let backlogSubjectCodes = columns.backlogSubjects
      ? splitCodes(cellText(row.getCell(columns.backlogSubjects)))
      : [];

    // Backwards-compatible simple format: Subject Codes + fresh/backlog flag.
    if (
      !freshSubjectCodes.length &&
      !backlogSubjectCodes.length &&
      generalCodes.length
    ) {
      if (type === "backlog") backlogSubjectCodes = generalCodes;
      else freshSubjectCodes = generalCodes;
    }

    if (
      !rollNo &&
      !name &&
      !freshSubjectCodes.length &&
      !backlogSubjectCodes.length
    )
      continue;

    const rowErrors = [];
    const department = departmentByCode.get(departmentCode);
    const course = courseByCode.get(courseCode);
    const semester = course
      ? semesterByKey.get(`${course._id}:${semesterNumber}`)
      : null;

    if (!rollNo) rowErrors.push("Roll No is required.");
    if (!name) rowErrors.push("Name is required.");
    if (!department) rowErrors.push(`Unknown department ${departmentCode}.`);
    if (!course) rowErrors.push(`Unknown course ${courseCode}.`);
    if (
      department &&
      course &&
      String(course.department) !== String(department._id)
    ) {
      rowErrors.push(
        `Course ${courseCode} does not belong to ${departmentCode}.`,
      );
    }
    if (!semester)
      rowErrors.push(
        `Semester ${semesterNumber || ""} is not configured for ${courseCode}.`,
      );
    if (!["fresh", "backlog"].includes(type))
      rowErrors.push('Type must be "fresh" or "backlog".');
    if (!freshSubjectCodes.length && !backlogSubjectCodes.length) {
      rowErrors.push("At least one fresh or backlog subject code is required.");
    }
    if (backlogSubjectCodes.length && !academicYear) {
      rowErrors.push(
        "Academic year is required when backlog subjects are present.",
      );
    }
    if (existingRollNos.has(rollNo))
      rowErrors.push(`Roll No ${rollNo} already exists.`);
    if (seenRollNos.has(rollNo))
      rowErrors.push(`Roll No ${rollNo} is duplicated in this workbook.`);
    seenRollNos.add(rollNo);

    const resolveSubjects = (codes, label) =>
      codes.flatMap((subjectCode) => {
        const subject = subjectByCode.get(subjectCode);
        if (!subject) {
          rowErrors.push(`Unknown ${label} subject ${subjectCode}.`);
          return [];
        }
        if (
          department &&
          String(subject.department) !== String(department._id)
        ) {
          rowErrors.push(
            `Subject ${subjectCode} does not belong to ${departmentCode}.`,
          );
        }
        return [subject];
      });

    const freshSubjects = resolveSubjects(freshSubjectCodes, "fresh");
    const backlogSubjects = resolveSubjects(backlogSubjectCodes, "backlog");

    const parsedRow = {
      rowNumber,
      rollNo,
      name,
      departmentCode,
      courseCode,
      semester: semesterNumber,
      type: backlogSubjectCodes.length ? "backlog" : type,
      email,
      freshSubjectCodes,
      backlogSubjectCodes,
      departmentId: department?._id,
      courseId: course?._id,
      semesterId: semester?._id,
      freshSubjectIds: freshSubjects.map((item) => item._id),
      backlogSubjectIds: backlogSubjects.map((item) => item._id),
    };

    rows.push(parsedRow);
    if (rowErrors.length)
      errors.push({ row: rowNumber, rollNo, errors: rowErrors });
  }

  return {
    rows,
    errors,
    rowCount: rows.length,
    validCount: rows.length - errors.length,
    invalidCount: errors.length,
  };
}

export async function commitWorkbook(parsed, academicYear) {
  if (parsed.errors.length) {
    throw new ApiError(
      422,
      "Import contains validation errors.",
      parsed.errors,
    );
  }

  const studentDocs = parsed.rows.map((row) => ({
    rollNo: row.rollNo,
    name: row.name,
    department: row.departmentId,
    course: row.courseId,
    semester: row.semesterId,
    type: row.backlogSubjectIds.length ? "backlog" : "fresh",
    subjects: row.freshSubjectIds,
    email: row.email || undefined,
  }));

  let inserted = [];
  try {
    inserted = await Student.insertMany(studentDocs, { ordered: true });
    const backlogDocs = [];
    parsed.rows.forEach((row, index) => {
      row.backlogSubjectIds.forEach((subject) => {
        backlogDocs.push({
          student: inserted[index]._id,
          subject,
          academicYear,
          status: "registered",
        });
      });
    });
    if (backlogDocs.length)
      await BacklogRegistration.insertMany(backlogDocs, { ordered: true });

    return {
      studentsInserted: inserted.length,
      backlogRegistrationsCreated: backlogDocs.length,
    };
  } catch (error) {
    // Excel is fully validated first; this cleanup avoids partial imports on standalone MongoDB too.
    if (inserted.length) {
      await BacklogRegistration.deleteMany({
        student: { $in: inserted.map((item) => item._id) },
      });
      await Student.deleteMany({
        _id: { $in: inserted.map((item) => item._id) },
      });
    }
    throw error;
  }
}

export async function templateBuffer() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Students");
  sheet.columns = [
    { header: "Roll No", key: "rollNo", width: 16 },
    { header: "Name", key: "name", width: 28 },
    { header: "Department Code", key: "department", width: 20 },
    { header: "Course Code", key: "course", width: 16 },
    { header: "Semester", key: "semester", width: 12 },
    { header: "Fresh Subject Codes", key: "freshSubjects", width: 34 },
    { header: "Backlog Subject Codes", key: "backlogSubjects", width: 34 },
    { header: "Type", key: "type", width: 14 },
    { header: "Email", key: "email", width: 30 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.addRow({
    rollNo: "MCS001",
    name: "Sample Fresh Student",
    department: "CS",
    course: "MCS",
    semester: 3,
    freshSubjects: "CS301,CS302,CS303",
    backlogSubjects: "",
    type: "fresh",
    email: "student@example.com",
  });
  sheet.addRow({
    rollNo: "MCS099",
    name: "Current + Backlog Student",
    department: "CS",
    course: "MCS",
    semester: 3,
    freshSubjects: "CS301,CS302,CS303",
    backlogSubjects: "CS101",
    type: "backlog",
    email: "backlog@example.com",
  });
  return workbook.xlsx.writeBuffer();
}
