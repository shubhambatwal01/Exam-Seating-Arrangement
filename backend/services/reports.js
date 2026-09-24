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
import {
  buildTimetableFormation,
  formatDisplayDate,
  romanSemester,
} from "./formation.js";

const COLLEGE = {
  society: "Progressive Education Society's",
  name: "MODERN COLLEGE OF ARTS, SCIENCE & COMMERCE",
  address: "Ganeshkhind, Pune - 411016.",
  status: "Autonomous",
};

function dateParts(value) {
  const raw = isoDate(value);
  if (!raw) return { iso: "", dotted: "", slash: "", dayName: "" };
  const [year, month, day] = raw.split("-");
  const d = new Date(`${raw}T00:00:00Z`);
  return {
    iso: raw,
    dotted: `${day}.${month}.${year}`,
    slash: `${day}/${month}/${year}`,
    dayName: d.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC",
    }),
  };
}

function time12(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return value || "";
  const [hour, minute] = value.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function timeRange(start, end) {
  return `${time12(start)} to ${time12(end)}`;
}

function safeSheetName(value, used) {
  const base =
    String(value || "Session")
      .replace(/[\\/*?:\[\]]/g, " ")
      .trim()
      .slice(0, 28) || "Session";
  let name = base;
  let i = 2;
  while (used.has(name)) {
    name = `${base.slice(0, 25)} ${i}`;
    i += 1;
  }
  used.add(name);
  return name;
}

function styleCollegeHeader(sheet, sessionLabel, session) {
  sheet.mergeCells("A1:G1");
  sheet.mergeCells("A2:G2");
  sheet.mergeCells("A3:G3");
  sheet.mergeCells("A4:G4");
  sheet.mergeCells("A5:G5");
  sheet.getCell("A1").value = COLLEGE.society;
  sheet.getCell("A2").value = COLLEGE.name;
  sheet.getCell("A3").value = COLLEGE.address;
  sheet.getCell("A4").value =
    `${COLLEGE.status} • ${session.name} • ${session.academicYear}`;
  sheet.getCell("A5").value = `${sessionLabel} Session`;

  [1, 2, 3, 4, 5].forEach((rowNo) => {
    const row = sheet.getRow(rowNo);
    row.alignment = { horizontal: "center", vertical: "middle" };
  });
  sheet.getRow(1).font = { bold: true, size: 12 };
  sheet.getRow(2).font = { bold: true, size: 15 };
  sheet.getRow(3).font = { bold: true, size: 11 };
  sheet.getRow(4).font = { bold: true, color: { argb: "FFDC2626" }, size: 11 };
  sheet.getRow(5).font = { bold: true, size: 18 };
  sheet.getRow(5).height = 26;
}

const thinBorder = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

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
    { header: "Department", key: "d", width: 20 },
    { header: "Course", key: "c", width: 20 },
    { header: "Semester", key: "sem", width: 12 },
    { header: "Type", key: "t", width: 12 },
    { header: "Subjects", key: "sub", width: 42 },
    { header: "Email", key: "e", width: 30 },
  ];
  s.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  s.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF075B73" },
  };
  rows.forEach((x) =>
    s.addRow({
      r: x.rollNo,
      n: x.name,
      d: x.department?.name || x.department?.code,
      c: x.course?.name || x.course?.code,
      sem: x.semester?.number,
      t: x.type,
      sub: x.subjects.map((y) => y.code).join(", "),
      e: x.email,
    }),
  );
  s.views = [{ state: "frozen", ySplit: 1 }];
  return wb.xlsx.writeBuffer();
}

/**
 * Timetable Excel now follows the supplied Modern College skeleton:
 * college header, Morning/Afternoon sheets, date sections and the columns
 * Class / Sub Code / Sem / Subject / Strength / Block No / Room No.
 */
export async function timetableXlsx(id) {
  const { session, rows } = await buildTimetableFormation(id);
  const wb = new ExcelJS.Workbook();
  wb.creator = "Exam Seating Arrangement & Timetable Management System";
  const used = new Set();
  const slotLabels = session.timeSlots?.map((slot) => slot.label) || [
    ...new Set(rows.map((row) => row.slotLabel)),
  ];

  for (const slotLabel of slotLabels) {
    const s = wb.addWorksheet(safeSheetName(slotLabel, used));
    s.pageSetup = {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.4,
        bottom: 0.4,
        header: 0.15,
        footer: 0.15,
      },
    };
    s.columns = [
      { key: "className", width: 22 },
      { key: "subjectCode", width: 17 },
      { key: "semester", width: 9 },
      { key: "subjectName", width: 36 },
      { key: "strength", width: 12 },
      { key: "blockNo", width: 11 },
      { key: "roomNo", width: 13 },
    ];
    styleCollegeHeader(s, slotLabel, session);

    const slotRows = rows.filter((row) => row.slotLabel === slotLabel);
    const dates = [...new Set(slotRows.map((row) => row.isoDate))];
    let cursor = 7;

    if (!dates.length) {
      s.mergeCells(`A${cursor}:G${cursor}`);
      s.getCell(`A${cursor}`).value =
        "No timetable entries generated for this session.";
      s.getCell(`A${cursor}`).alignment = { horizontal: "center" };
      continue;
    }

    for (const date of dates) {
      const dateRows = slotRows.filter((row) => row.isoDate === date);
      const time = dateRows[0]
        ? timeRange(dateRows[0].startTime, dateRows[0].endTime)
        : "";

      s.mergeCells(`A${cursor}:D${cursor}`);
      s.mergeCells(`E${cursor}:G${cursor}`);
      s.getCell(`A${cursor}`).value = `Date : ${formatDisplayDate(date)}`;
      s.getCell(`E${cursor}`).value = `Time : ${time}`;
      s.getCell(`A${cursor}`).font = { bold: true, size: 11 };
      s.getCell(`E${cursor}`).font = { bold: true, size: 11 };
      s.getCell(`E${cursor}`).alignment = { horizontal: "right" };
      cursor += 1;

      const headers = [
        "Class",
        "Sub Code",
        "Sem",
        "Subject",
        "Strength",
        "Block No",
        "Room No",
      ];
      headers.forEach((value, index) => {
        const cell = s.getCell(cursor, index + 1);
        cell.value = value;
        cell.font = { bold: true, size: 10 };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = thinBorder;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
      });
      s.getRow(cursor).height = 26;
      cursor += 1;

      for (const row of dateRows) {
        const values = [
          row.className,
          row.subjectCode,
          row.semesterRoman,
          row.subjectName,
          row.allocationStrength,
          row.blockNo,
          row.roomNo,
        ];
        values.forEach((value, index) => {
          const cell = s.getCell(cursor, index + 1);
          cell.value = value;
          cell.border = thinBorder;
          cell.alignment = {
            horizontal: index === 3 ? "left" : "center",
            vertical: "middle",
            wrapText: true,
          };
          if (index === 4) {
            cell.font = { color: { argb: "FFFF0000" }, size: 11 };
          }
        });
        s.getRow(cursor).height = 22;
        cursor += 1;
      }
      cursor += 1;
    }
  }

  return wb.xlsx.writeBuffer();
}

async function buildSeatingSections(sessionId, arrangementId = null) {
  const { session, rows: formationRows } =
    await buildTimetableFormation(sessionId);
  const filter = { examSession: sessionId };
  if (arrangementId) filter._id = arrangementId;

  const arrangements = await SeatingArrangement.find(filter)
    .populate("classroom", "roomNo building capacity rows columns")
    .sort({ date: 1, timeSlot: 1 })
    .lean();

  const timetable = await Timetable.find({ examSession: sessionId })
    .populate({
      path: "subject",
      populate: [
        { path: "course", select: "name code" },
        { path: "semester", select: "number" },
        { path: "department", select: "name code" },
      ],
    })
    .lean();

  const timetableMap = new Map();
  for (const row of timetable) {
    if (!row.subject) continue;
    timetableMap.set(
      `${isoDate(row.date)}|${row.slotLabel}|${row.subject.code}`,
      row,
    );
  }

  const blockMap = new Map();
  for (const row of formationRows) {
    if (!row.seatingGenerated) continue;
    blockMap.set(
      `${row.isoDate}|${row.slotLabel}|${row.roomNo}|${row.subjectCode}`,
      row.blockNo,
    );
  }

  const sections = [];
  for (const arrangement of arrangements) {
    const bySubject = new Map();
    for (const seat of arrangement.seatMap || []) {
      if (!seat.studentId || !seat.subjectCode) continue;
      if (!bySubject.has(seat.subjectCode)) bySubject.set(seat.subjectCode, []);
      bySubject.get(seat.subjectCode).push(seat);
    }

    for (const [subjectCode, seats] of [...bySubject.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      const tt = timetableMap.get(
        `${isoDate(arrangement.date)}|${arrangement.timeSlot}|${subjectCode}`,
      );
      sections.push({
        arrangementId: String(arrangement._id),
        session,
        date: arrangement.date,
        slotLabel: arrangement.timeSlot,
        startTime: tt?.startTime || "",
        endTime: tt?.endTime || "",
        roomNo: arrangement.classroom?.roomNo || "-",
        building: arrangement.classroom?.building || "",
        blockNo:
          blockMap.get(
            `${isoDate(arrangement.date)}|${arrangement.timeSlot}|${arrangement.classroom?.roomNo || "-"}|${subjectCode}`,
          ) || "-",
        subjectCode,
        subjectName: tt?.subject?.name || subjectCode,
        className:
          tt?.subject?.course?.name || tt?.subject?.course?.code || "-",
        semester: tt?.subject?.semester?.number || "",
        semesterRoman: romanSemester(tt?.subject?.semester?.number),
        seats: seats.sort((a, b) =>
          String(a.seatNo).localeCompare(String(b.seatNo), undefined, {
            numeric: true,
          }),
        ),
      });
    }
  }

  return { session, sections };
}

function benchLabel(roomNo, seat) {
  const original = String(seat?.seatNo || "").trim();
  if (!original) return "";
  if (/\-L\-?\d+$/i.test(original)) return original;
  const match = original.match(/(\d+)$/);
  const number = match
    ? match[1].padStart(2, "0")
    : String(seat.row || "").padStart(2, "0");
  return `${roomNo}-L-${number}`;
}

function addSeatingSectionToSheet(sheet, section, startRow) {
  let row = startRow;
  sheet.mergeCells(`A${row}:F${row}`);
  sheet.getCell(`A${row}`).value = COLLEGE.society;
  sheet.getCell(`A${row}`).font = { bold: true, size: 11 };
  sheet.getCell(`A${row}`).alignment = { horizontal: "center" };
  row += 1;

  sheet.mergeCells(`A${row}:F${row}`);
  sheet.getCell(`A${row}`).value = COLLEGE.name;
  sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
  sheet.getCell(`A${row}`).alignment = { horizontal: "center" };
  row += 1;

  sheet.mergeCells(`A${row}:F${row}`);
  sheet.getCell(`A${row}`).value = COLLEGE.address;
  sheet.getCell(`A${row}`).font = { bold: true, size: 10 };
  sheet.getCell(`A${row}`).alignment = { horizontal: "center" };
  row += 1;

  sheet.mergeCells(`A${row}:F${row}`);
  sheet.getCell(`A${row}`).value =
    `${section.slotLabel} Session (${section.session.name})`;
  sheet.getCell(`A${row}`).font = { bold: true, size: 16 };
  sheet.getCell(`A${row}`).alignment = { horizontal: "center" };
  row += 1;

  sheet.mergeCells(`A${row}:B${row}`);
  sheet.mergeCells(`C${row}:D${row}`);
  sheet.mergeCells(`E${row}:F${row}`);
  sheet.getCell(`A${row}`).value = `Date : ${dateParts(section.date).slash}`;
  sheet.getCell(`C${row}`).value = `Class : ${section.className}`;
  sheet.getCell(`E${row}`).value = `Block No : ${section.blockNo}`;
  row += 1;

  sheet.mergeCells(`A${row}:D${row}`);
  sheet.mergeCells(`E${row}:F${row}`);
  sheet.getCell(`A${row}`).value = `Subject : ${section.subjectName}`;
  sheet.getCell(`E${row}`).value = `Room No : ${section.roomNo}`;
  row += 1;

  sheet.mergeCells(`A${row}:D${row}`);
  sheet.mergeCells(`E${row}:F${row}`);
  sheet.getCell(`A${row}`).value = `Sub Code : ${section.subjectCode}`;
  sheet.getCell(`E${row}`).value =
    `Time : ${timeRange(section.startTime, section.endTime)}`;
  row += 1;

  sheet.mergeCells(`A${row}:D${row}`);
  sheet.mergeCells(`E${row}:F${row}`);
  sheet.getCell(`A${row}`).value = `Sem : ${section.semesterRoman}`;
  sheet.getCell(`E${row}`).value = `Total : ${section.seats.length}`;
  row += 1;

  [
    "R.No./ Ben. No",
    "Seat No",
    "R.No./ Ben. No",
    "Seat No",
    "R.No./ Ben. No",
    "Seat No",
  ].forEach((value, index) => {
    const cell = sheet.getCell(row, index + 1);
    cell.value = value;
    cell.font = { bold: true, italic: index % 2 === 0 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = thinBorder;
    if (index % 2 === 0) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD1D5DB" },
      };
    }
  });
  row += 1;

  const rowsPerColumn = Math.max(1, Math.ceil(section.seats.length / 3));
  for (let line = 0; line < rowsPerColumn; line += 1) {
    for (let group = 0; group < 3; group += 1) {
      const seat = section.seats[group * rowsPerColumn + line];
      const benchCell = sheet.getCell(row, group * 2 + 1);
      const rollCell = sheet.getCell(row, group * 2 + 2);
      benchCell.value = seat ? benchLabel(section.roomNo, seat) : "";
      rollCell.value = seat ? seat.rollNo : "";
      benchCell.border = thinBorder;
      rollCell.border = thinBorder;
      benchCell.alignment = { horizontal: "center" };
      rollCell.alignment = { horizontal: "center" };
      benchCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };
    }
    row += 1;
  }
  return row + 2;
}

/** Printable seating workbook matching the supplied hall-wise sheet. */
export async function seatingXlsx(id) {
  const { session, sections } = await buildSeatingSections(id);
  const wb = new ExcelJS.Workbook();
  const used = new Set();
  const labels = session.timeSlots?.map((x) => x.label) || [
    ...new Set(sections.map((x) => x.slotLabel)),
  ];

  for (const label of labels) {
    const sheet = wb.addWorksheet(safeSheetName(label, used));
    sheet.columns = [
      { width: 22 },
      { width: 17 },
      { width: 22 },
      { width: 17 },
      { width: 22 },
      { width: 17 },
    ];
    sheet.pageSetup = {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.2,
        right: 0.2,
        top: 0.3,
        bottom: 0.3,
        header: 0.1,
        footer: 0.1,
      },
    };
    let row = 1;
    for (const section of sections.filter((x) => x.slotLabel === label)) {
      row = addSeatingSectionToSheet(sheet, section, row);
    }
    if (row === 1) {
      sheet.mergeCells("A1:F1");
      sheet.getCell("A1").value = "No seating generated for this session.";
      sheet.getCell("A1").alignment = { horizontal: "center" };
    }
  }

  return wb.xlsx.writeBuffer();
}

function pdfInstitutionHeader(doc, session, title, subtitle = "") {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(COLLEGE.society, { align: "center" })
    .fontSize(14)
    .text(COLLEGE.name, { align: "center" })
    .fontSize(9)
    .text(COLLEGE.address, { align: "center" })
    .fontSize(9)
    .fillColor("#b91c1c")
    .text(`${COLLEGE.status} • ${session.name} • ${session.academicYear}`, {
      align: "center",
    })
    .fillColor("#111827")
    .moveDown(0.25)
    .fontSize(16)
    .text(title, { align: "center" });
  if (subtitle) {
    doc.font("Helvetica").fontSize(9).text(subtitle, { align: "center" });
  }
  doc.moveDown(0.6);
}

function drawCells(doc, x, y, widths, values, height, options = {}) {
  let cursor = x;
  values.forEach((value, index) => {
    const width = widths[index];
    doc.rect(cursor, y, width, height).strokeColor("#111827").stroke();
    if (options.fills?.[index]) {
      doc
        .save()
        .rect(cursor, y, width, height)
        .fill(options.fills[index])
        .restore();
      doc.rect(cursor, y, width, height).strokeColor("#111827").stroke();
    }
    doc
      .fillColor(options.colors?.[index] || "#111827")
      .font(options.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(options.fontSize || 8)
      .text(String(value ?? ""), cursor + 3, y + 5, {
        width: width - 6,
        height: height - 8,
        align: options.aligns?.[index] || "center",
        valign: "center",
        ellipsis: true,
      });
    cursor += width;
  });
  doc.fillColor("#111827");
}

export async function timetablePdf(res, id) {
  const { session, rows } = await buildTimetableFormation(id);
  const doc = new PDFDocument({ margin: 28, size: "A4" });
  doc.pipe(res);

  const groups = [];
  for (const row of rows) {
    const key = `${row.isoDate}|${row.slotLabel}`;
    let group = groups.find((item) => item.key === key);
    if (!group) {
      group = { key, date: row.date, slotLabel: row.slotLabel, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }

  if (!groups.length) {
    pdfInstitutionHeader(doc, session, "Examination Timetable");
    doc.fontSize(11).text("No timetable has been generated for this session.", {
      align: "center",
    });
    doc.end();
    return;
  }

  const widths = [90, 72, 38, 170, 55, 48, 65];
  let firstPage = true;

  for (const group of groups) {
    if (!firstPage) doc.addPage();
    firstPage = false;
    const first = group.rows[0];
    pdfInstitutionHeader(
      doc,
      session,
      `${group.slotLabel} Session`,
      `Date: ${dateParts(group.date).slash}    •    Time: ${timeRange(first.startTime, first.endTime)}`,
    );

    let y = doc.y;
    const x = 28;
    const header = [
      "Class",
      "Sub Code",
      "Sem",
      "Subject",
      "Strength",
      "Block No",
      "Room No",
    ];
    drawCells(doc, x, y, widths, header, 28, {
      bold: true,
      fontSize: 8,
      fills: new Array(7).fill("#f1f5f9"),
    });
    y += 28;

    for (const row of group.rows) {
      if (y > 760) {
        doc.addPage();
        pdfInstitutionHeader(
          doc,
          session,
          `${group.slotLabel} Session (continued)`,
          `Date: ${dateParts(group.date).slash}`,
        );
        y = doc.y;
        drawCells(doc, x, y, widths, header, 28, {
          bold: true,
          fontSize: 8,
          fills: new Array(7).fill("#f1f5f9"),
        });
        y += 28;
      }
      drawCells(
        doc,
        x,
        y,
        widths,
        [
          row.className,
          row.subjectCode,
          row.semesterRoman,
          row.subjectName,
          row.allocationStrength,
          row.blockNo,
          row.roomNo,
        ],
        26,
        {
          fontSize: 7.5,
          colors: [null, null, null, null, "#dc2626"],
          aligns: ["center", "center", "center", "left"],
        },
      );
      y += 26;
    }
  }

  doc.end();
}

export async function seatingPdf(res, id) {
  const arrangement = await SeatingArrangement.findById(id).lean();
  if (!arrangement) throw new ApiError(404, "Seating arrangement not found.");
  const { session, sections } = await buildSeatingSections(
    arrangement.examSession,
    id,
  );
  if (!sections.length)
    throw new ApiError(404, "No occupied seats exist in this arrangement.");

  const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
  doc.pipe(res);
  let first = true;

  for (const section of sections) {
    const pageSize = 42; // 14 table rows × 3 seat-pairs, fits one landscape A4 page.
    const chunks = [];
    for (let offset = 0; offset < section.seats.length; offset += pageSize) {
      chunks.push(section.seats.slice(offset, offset + pageSize));
    }
    if (!chunks.length) chunks.push([]);

    for (let part = 0; part < chunks.length; part += 1) {
      const pageSeats = chunks[part];
      if (!first) doc.addPage();
      first = false;

      pdfInstitutionHeader(
        doc,
        session,
        `${section.slotLabel} Session (${session.name})${chunks.length > 1 ? ` - Part ${part + 1}/${chunks.length}` : ""}`,
      );

      const left = 38;
      const right = 430;
      const top = doc.y;
      doc.font("Helvetica-Bold").fontSize(10);
      doc.text(`Date : ${dateParts(section.date).slash}`, left, top);
      doc.text(`Class : ${section.className}`, left + 180, top, { width: 270 });
      doc.text(`Block No : ${section.blockNo}`, right + 230, top, {
        width: 120,
      });
      doc.text(`Subject : ${section.subjectName}`, left, top + 20, {
        width: 430,
      });
      doc.text(`Room No : ${section.roomNo}`, right + 230, top + 20, {
        width: 120,
      });
      doc.text(`Sub Code : ${section.subjectCode}`, left, top + 40, {
        width: 430,
      });
      doc.text(
        `Time : ${timeRange(section.startTime, section.endTime)}`,
        right + 170,
        top + 40,
        {
          width: 180,
          align: "right",
        },
      );
      doc.text(`Sem : ${section.semesterRoman}`, left, top + 60);
      doc.text(`Total : ${section.seats.length}`, right + 230, top + 60, {
        width: 120,
        align: "right",
      });

      let y = top + 86;
      const widths = [125, 105, 125, 105, 125, 105];
      drawCells(
        doc,
        left,
        y,
        widths,
        [
          "R.No./ Ben. No",
          "Seat No",
          "R.No./ Ben. No",
          "Seat No",
          "R.No./ Ben. No",
          "Seat No",
        ],
        26,
        {
          bold: true,
          fontSize: 8,
          fills: ["#d1d5db", null, "#d1d5db", null, "#d1d5db", null],
        },
      );
      y += 26;

      const perColumn = Math.max(1, Math.ceil(pageSeats.length / 3));
      const rowHeight = 22;
      for (let line = 0; line < perColumn; line += 1) {
        const values = [];
        for (let group = 0; group < 3; group += 1) {
          const seat = pageSeats[group * perColumn + line];
          values.push(seat ? benchLabel(section.roomNo, seat) : "");
          values.push(seat ? seat.rollNo : "");
        }
        drawCells(doc, left, y, widths, values, rowHeight, {
          fontSize: 8.2,
          fills: ["#e5e7eb", null, "#e5e7eb", null, "#e5e7eb", null],
        });
        y += rowHeight;
      }
    }
  }

  doc.end();
}

export async function hallTicketData(studentId, sessionId) {
  if (!sessionId) throw new ApiError(422, "examSessionId is required.");

  const [student, session] = await Promise.all([
    Student.findById(studentId)
      .populate("department course semester subjects")
      .lean(),
    ExamSession.findById(sessionId).lean(),
  ]);
  if (!student || !session)
    throw new ApiError(404, "Student or exam session not found.");

  const backlog = await BacklogRegistration.find({
    student: studentId,
    academicYear: session.academicYear,
    status: "registered",
  })
    .populate("subject", "name code")
    .lean();

  const freshIds = student.subjects.map((subject) => String(subject._id));
  const backlogIds = backlog
    .map((registration) => registration.subject?._id)
    .filter(Boolean)
    .map(String);
  const ids = [...new Set([...freshIds, ...backlogIds])];

  const typeBySubject = new Map(freshIds.map((id) => [id, "Fresh"]));
  backlogIds.forEach((id) => typeBySubject.set(id, "Backlog"));

  const timetable = await Timetable.find({
    examSession: sessionId,
    subject: { $in: ids },
  })
    .populate("subject", "name code")
    .sort({ date: 1, startTime: 1 })
    .lean();

  const arrangements = await SeatingArrangement.find({
    examSession: sessionId,
    "seatMap.studentId": studentId,
  })
    .populate("classroom", "roomNo building")
    .lean();

  const papers = timetable.map((row, index) => {
    let found = null;
    for (const arrangement of arrangements) {
      if (
        isoDate(arrangement.date) !== isoDate(row.date) ||
        arrangement.timeSlot !== row.slotLabel
      )
        continue;
      const seat = arrangement.seatMap.find(
        (item) =>
          String(item.studentId) === String(studentId) &&
          (!item.subjectCode || item.subjectCode === row.subject?.code),
      );
      if (seat) {
        found = {
          roomNo: arrangement.classroom?.roomNo || "TBA",
          building: arrangement.classroom?.building || "",
          seatNo: benchLabel(arrangement.classroom?.roomNo || "", seat),
        };
        break;
      }
    }

    const date = dateParts(row.date);
    return {
      srNo: index + 1,
      date: date.slash,
      isoDate: date.iso,
      day: date.dayName,
      slotLabel: row.slotLabel,
      startTime: row.startTime,
      endTime: row.endTime,
      time: timeRange(row.startTime, row.endTime),
      subjectCode: row.subject?.code || "",
      subjectName: row.subject?.name || "",
      appearanceType: typeBySubject.get(String(row.subject?._id)) || "Fresh",
      roomNo: found?.roomNo || "TBA",
      building: found?.building || "",
      seatNo: found?.seatNo || "TBA",
    };
  });

  return {
    hallTicketNo: `HT-${String(session.academicYear).replace(/\W/g, "")}-${student.rollNo}`,
    student: {
      _id: student._id,
      rollNo: student.rollNo,
      name: student.name,
      email: student.email || "",
      department: student.department?.name || student.department?.code || "-",
      departmentCode: student.department?.code || "",
      course: student.course?.name || student.course?.code || "-",
      courseCode: student.course?.code || "",
      semester: student.semester?.number || "",
      semesterRoman: romanSemester(student.semester?.number),
    },
    session: {
      _id: session._id,
      name: session.name,
      academicYear: session.academicYear,
      startDate: session.startDate,
      endDate: session.endDate,
    },
    papers,
  };
}

export async function hallTicketPdf(res, studentId, sessionId) {
  const data = await hallTicketData(studentId, sessionId);
  const doc = new PDFDocument({ margin: 34, size: "A4" });
  doc.pipe(res);

  pdfInstitutionHeader(
    doc,
    data.session,
    "STUDENT EXAMINATION HALL TICKET",
    `Hall Ticket No: ${data.hallTicketNo}`,
  );

  const x = 34;
  let y = doc.y + 2;
  const infoWidth = 527;
  const lineHeight = 22;
  const labelWidth = 92;

  const infoRows = [
    [
      "Seat / Roll No",
      data.student.rollNo,
      "Semester",
      data.student.semesterRoman,
    ],
    ["Student Name", data.student.name, "Course", data.student.course],
    ["Department", data.student.department, "Exam Session", data.session.name],
    [
      "Academic Year",
      data.session.academicYear,
      "Status",
      "Eligible to Appear",
    ],
  ];

  for (const row of infoRows) {
    doc.rect(x, y, infoWidth, lineHeight).stroke("#94a3b8");
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(row[0], x + 5, y + 7, {
        width: labelWidth,
      });
    doc.font("Helvetica").text(row[1], x + labelWidth, y + 7, { width: 190 });
    doc.font("Helvetica-Bold").text(row[2], x + 292, y + 7, { width: 80 });
    doc.font("Helvetica").text(row[3], x + 372, y + 7, { width: 150 });
    y += lineHeight;
  }

  y += 14;
  doc.font("Helvetica-Bold").fontSize(10).text("Examination Schedule", x, y);
  y += 17;

  const widths = [24, 58, 34, 72, 62, 145, 52, 40, 40];
  const headers = [
    "Sr",
    "Date",
    "Day",
    "Time",
    "Sub Code",
    "Subject",
    "Type",
    "Room",
    "Bench",
  ];
  drawCells(doc, x, y, widths, headers, 28, {
    bold: true,
    fontSize: 7,
    fills: new Array(headers.length).fill("#e2e8f0"),
  });
  y += 28;

  if (!data.papers.length) {
    drawCells(
      doc,
      x,
      y,
      [widths.reduce((a, b) => a + b, 0)],
      [
        "No examination papers are scheduled for this student in the selected session.",
      ],
      40,
      { fontSize: 8 },
    );
    y += 40;
  } else {
    for (const paper of data.papers) {
      if (y > 650) {
        doc.addPage();
        pdfInstitutionHeader(
          doc,
          data.session,
          "STUDENT EXAMINATION HALL TICKET (CONTINUED)",
        );
        y = doc.y;
        drawCells(doc, x, y, widths, headers, 28, {
          bold: true,
          fontSize: 7,
          fills: new Array(headers.length).fill("#e2e8f0"),
        });
        y += 28;
      }
      drawCells(
        doc,
        x,
        y,
        widths,
        [
          paper.srNo,
          paper.date,
          paper.day,
          paper.time,
          paper.subjectCode,
          paper.subjectName,
          paper.appearanceType,
          paper.roomNo,
          paper.seatNo,
        ],
        34,
        {
          fontSize: 6.8,
          aligns: ["center", "center", "center", "center", "center", "left"],
        },
      );
      y += 34;
    }
  }

  y += 16;
  doc.font("Helvetica-Bold").fontSize(9).text("Important Instructions", x, y);
  y += 14;
  const instructions = [
    "Carry this hall ticket and a valid college identity card to every examination.",
    "Report to the allotted room at least 30 minutes before the examination starts.",
    "Verify the date, time, subject code and room before entering the examination hall.",
    "Electronic devices and unauthorized study material are not permitted in the examination hall.",
    "Fresh and backlog papers shown above are based on the student's registered examination appearances.",
    "Room/bench marked TBA will be updated after the seating arrangement is generated.",
  ];
  doc.font("Helvetica").fontSize(7.5);
  instructions.forEach((text, index) => {
    doc.text(`${index + 1}. ${text}`, x + 5, y, { width: infoWidth - 10 });
    y += 13;
  });

  y = Math.max(y + 24, 735);
  if (y > 780) {
    doc.addPage();
    y = 690;
  }
  doc
    .font("Helvetica")
    .fontSize(8)
    .text("Student Signature", x + 10, y, { width: 120, align: "center" })
    .text("Exam Coordinator", x + 205, y, { width: 120, align: "center" })
    .text("Principal / Controller of Examinations", x + 375, y, {
      width: 150,
      align: "center",
    });

  doc.end();
}
