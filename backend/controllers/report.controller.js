import {
  hallTicketPdf,
  seatingPdf,
  seatingXlsx,
  studentsXlsx,
  timetablePdf,
  timetableXlsx,
} from "../services/reports.js";

function excelHeaders(res, filename) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
}

function pdfHeaders(res, filename) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
}

export async function exportStudentsExcel(_req, res) {
  excelHeaders(res, "students.xlsx");
  return res.send(Buffer.from(await studentsXlsx()));
}

export async function exportTimetableExcel(req, res) {
  excelHeaders(res, "exam-timetable.xlsx");
  return res.send(Buffer.from(await timetableXlsx(req.params.id)));
}

export async function exportSeatingExcel(req, res) {
  excelHeaders(res, "seating.xlsx");
  return res.send(Buffer.from(await seatingXlsx(req.params.id)));
}

export async function exportTimetablePdf(req, res) {
  pdfHeaders(res, "exam-timetable.pdf");
  return timetablePdf(res, req.params.id);
}

export async function exportSeatingPdf(req, res) {
  pdfHeaders(res, "seating-chart.pdf");
  return seatingPdf(res, req.params.id);
}

export async function exportHallTicketPdf(req, res) {
  pdfHeaders(res, "hall-ticket.pdf");
  return hallTicketPdf(res, req.params.studentId, req.query.examSessionId);
}
