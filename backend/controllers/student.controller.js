import { BacklogRegistration, Student } from "../models/index.js";
import {
  commitWorkbook,
  parseWorkbook,
  templateBuffer,
} from "../services/studentImport.js";
import { ApiError, ok } from "../utils/http.js";

export async function listStudents(req, res) {
  const filter = { active: true };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.q) {
    filter.$or = [
      { rollNo: { $regex: req.query.q, $options: "i" } },
      { name: { $regex: req.query.q, $options: "i" } },
    ];
  }

  const items = await Student.find(filter)
    .populate("department course semester subjects")
    .sort({ rollNo: 1 })
    .lean();
  return ok(res, { items, total: items.length });
}

export async function getStudent(req, res) {
  const student = await Student.findById(req.params.id)
    .populate("department course semester subjects")
    .lean();
  if (!student) throw new ApiError(404, "Student not found.");

  const backlogRegistrations = await BacklogRegistration.find({
    student: student._id,
    status: "registered",
  })
    .populate("subject")
    .lean();

  return ok(res, { ...student, backlogRegistrations });
}

export async function createStudent(req, res) {
  return ok(res, await Student.create(req.body), "Student created.", 201);
}

export async function updateStudent(req, res) {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!student) throw new ApiError(404, "Student not found.");
  return ok(res, student, "Student updated.");
}

export async function archiveStudent(req, res) {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true },
  );
  if (!student) throw new ApiError(404, "Student not found.");
  return ok(res, { id: student._id }, "Student archived.");
}

export async function downloadImportTemplate(_req, res) {
  const buffer = await templateBuffer();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="student-import-template.xlsx"',
  );
  return res.send(Buffer.from(buffer));
}

export async function validateStudentImport(req, res) {
  if (!req.file)
    throw new ApiError(400, "Upload an .xlsx file using field 'file'.");
  const parsed = await parseWorkbook(
    req.file.buffer,
    String(req.body.academicYear || ""),
  );

  const preview = parsed.rows.slice(0, 25).map((row) => {
    const {
      departmentId,
      courseId,
      semesterId,
      freshSubjectIds,
      backlogSubjectIds,
      ...safeRow
    } = row;
    return safeRow;
  });

  return ok(
    res,
    {
      rowCount: parsed.rowCount,
      validCount: parsed.validCount,
      invalidCount: parsed.invalidCount,
      preview,
      errors: parsed.errors,
    },
    parsed.errors.length
      ? "Validation completed with errors."
      : "Workbook is valid and ready to import.",
  );
}

export async function commitStudentImport(req, res) {
  if (!req.file) throw new ApiError(400, "Upload an .xlsx file.");
  const academicYear = String(req.body.academicYear || "");
  const parsed = await parseWorkbook(req.file.buffer, academicYear);
  const result = await commitWorkbook(parsed, academicYear);
  return ok(res, result, "Student import completed.", 201);
}
