import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import {
  Student,
  Timetable,
  SeatingArrangement,
  ExamSession,
  BacklogRegistration,
} from "../models/index.js";
import { ApiError, isoDate } from "../utils/http.js";
export async function studentsXlsx() {
  const rows = await Student.find({ active: true })
      .populate("department course semester subjects")
      .sort({ rollNo: 1 })
      .lean(),
    wb = new ExcelJS.Workbook(),
    s = wb.addWorksheet("Students");
  s.columns = [
    { header: "Roll No", key: "r", width: 16 },
    { header: "Name", key: "n", width: 28 },
    { header: "Department", key: "d", width: 16 },
    { header: "Course", key: "c", width: 16 },
    { header: "Semester", key: "sem", width: 12 },
    { header: "Type", key: "t", width: 12 },
    { header: "Subjects", key: "sub", width: 34 },
    { header: "Email", key: "e", width: 28 },
  ];
  s.getRow(1).font = { bold: true };
  rows.forEach((x) =>
    s.addRow({
      r: x.rollNo,
      n: x.name,
      d: x.department?.code,
      c: x.course?.code,
      sem: x.semester?.number,
      t: x.type,
      sub: x.subjects.map((y) => y.code).join(", "),
      e: x.email,
    }),
  );
  return wb.xlsx.writeBuffer();
}
export async function timetableXlsx(id) {
  const rows = await Timetable.find({ examSession: id })
      .populate("subject")
      .sort({ date: 1, startTime: 1 })
      .lean(),
    wb = new ExcelJS.Workbook(),
    s = wb.addWorksheet("Timetable");
  s.columns = [
    { header: "Date", key: "d", width: 14 },
    { header: "Slot", key: "sl", width: 16 },
    { header: "Start", key: "st", width: 10 },
    { header: "End", key: "en", width: 10 },
    { header: "Subject Code", key: "c", width: 18 },
    { header: "Subject", key: "n", width: 34 },
  ];
  s.getRow(1).font = { bold: true };
  rows.forEach((x) =>
    s.addRow({
      d: isoDate(x.date),
      sl: x.slotLabel,
      st: x.startTime,
      en: x.endTime,
      c: x.subject?.code,
      n: x.subject?.name,
    }),
  );
  return wb.xlsx.writeBuffer();
}
export async function seatingXlsx(id) {
  const rows = await SeatingArrangement.find({ examSession: id })
      .populate("classroom")
      .lean(),
    wb = new ExcelJS.Workbook(),
    s = wb.addWorksheet("Seating");
  s.columns = [
    { header: "Date", key: "d", width: 14 },
    { header: "Slot", key: "sl", width: 14 },
    { header: "Room", key: "rm", width: 12 },
    { header: "Seat", key: "se", width: 16 },
    { header: "Roll No", key: "r", width: 16 },
    { header: "Student", key: "n", width: 26 },
    { header: "Subject", key: "su", width: 14 },
    { header: "Appearance", key: "a", width: 14 },
    { header: "Attendance", key: "at", width: 14 },
  ];
  s.getRow(1).font = { bold: true };
  for (const x of rows)
    for (const z of x.seatMap.filter((q) => q.studentId))
      s.addRow({
        d: isoDate(x.date),
        sl: x.timeSlot,
        rm: x.classroom?.roomNo,
        se: z.seatNo,
        r: z.rollNo,
        n: z.studentName,
        su: z.subjectCode,
        a: z.appearanceType,
        at: z.attendance,
      });
  return wb.xlsx.writeBuffer();
}
export async function timetablePdf(res, id) {
  const session = await ExamSession.findById(id).lean();
  if (!session) throw new ApiError(404, "Exam session not found.");
  const rows = await Timetable.find({ examSession: id })
      .populate("subject")
      .sort({ date: 1, startTime: 1 })
      .lean(),
    doc = new PDFDocument({ margin: 42 });
  doc.pipe(res);
  doc
    .fontSize(18)
    .text("Exam Timetable", { align: "center" })
    .fontSize(11)
    .text(`${session.name} • ${session.academicYear}`, { align: "center" })
    .moveDown();
  rows.forEach((x) =>
    doc
      .fontSize(10)
      .text(
        `${isoDate(x.date)} | ${x.slotLabel} ${x.startTime}-${x.endTime} | ${x.subject?.code} - ${x.subject?.name}`,
      )
      .moveDown(0.3),
  );
  doc.end();
}
export async function seatingPdf(res, id) {
  const x = await SeatingArrangement.findById(id)
    .populate("examSession classroom")
    .lean();
  if (!x) throw new ApiError(404, "Seating arrangement not found.");
  const doc = new PDFDocument({ margin: 32, size: "A4", layout: "landscape" });
  doc.pipe(res);
  doc
    .fontSize(16)
    .text("Hall-wise Seating Chart", { align: "center" })
    .fontSize(10)
    .text(
      `${x.examSession?.name} | ${isoDate(x.date)} | ${x.timeSlot} | Room ${x.classroom?.roomNo}`,
      { align: "center" },
    )
    .moveDown();
  const cols = x.classroom?.columns || 1,
    w = 95,
    h = 45,
    start = 32;
  let px = start,
    py = doc.y;
  x.seatMap.forEach((s, i) => {
    if (i && i % cols === 0) {
      px = start;
      py += h;
    }
    doc
      .rect(px, py, w, h)
      .stroke()
      .fontSize(7)
      .text(s.seatNo, px + 3, py + 3, { width: w - 6 });
    doc
      .fontSize(8)
      .text(
        s.studentId ? `${s.rollNo}\n${s.subjectCode}` : "EMPTY",
        px + 3,
        py + 15,
        { width: w - 6, align: "center" },
      );
    px += w;
  });
  doc.end();
}
export async function hallTicketPdf(res, studentId, sessionId) {
  const [student, session] = await Promise.all([
    Student.findById(studentId).populate("course semester subjects").lean(),
    ExamSession.findById(sessionId).lean(),
  ]);
  if (!student || !session)
    throw new ApiError(404, "Student or exam session not found.");
  const back = await BacklogRegistration.find({
      student: studentId,
      academicYear: session.academicYear,
      status: "registered",
    }).lean(),
    ids = [
      ...new Set([
        ...student.subjects.map((s) => String(s._id)),
        ...back.map((b) => String(b.subject)),
      ]),
    ],
    tt = await Timetable.find({ examSession: sessionId, subject: { $in: ids } })
      .populate("subject")
      .sort({ date: 1, startTime: 1 })
      .lean(),
    seat = await SeatingArrangement.find({
      examSession: sessionId,
      "seatMap.studentId": studentId,
    })
      .populate("classroom")
      .lean(),
    lookup = new Map();
  seat.forEach((a) => {
    const z = a.seatMap.find((q) => String(q.studentId) === String(studentId));
    if (z)
      lookup.set(
        `${isoDate(a.date)}:${a.timeSlot}`,
        `${a.classroom?.roomNo} / ${z.seatNo}`,
      );
  });
  const doc = new PDFDocument({ margin: 42 });
  doc.pipe(res);
  doc
    .fontSize(18)
    .text("Examination Hall Ticket", { align: "center" })
    .moveDown()
    .fontSize(11)
    .text(`Student: ${student.name}`)
    .text(`Roll No: ${student.rollNo}`)
    .text(
      `Course: ${student.course?.name} | Semester: ${student.semester?.number}`,
    )
    .text(`Session: ${session.name} (${session.academicYear})`)
    .moveDown();
  tt.forEach((x) =>
    doc
      .fontSize(9)
      .text(
        `${isoDate(x.date)} | ${x.startTime}-${x.endTime} | ${x.subject?.code} ${x.subject?.name} | Room/Seat: ${lookup.get(`${isoDate(x.date)}:${x.slotLabel}`) || "TBA"}`,
      )
      .moveDown(0.3),
  );
  doc.end();
}
