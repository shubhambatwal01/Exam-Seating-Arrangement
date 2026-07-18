const Subject = require("../models/subject");

const Holiday = require("../models/holiday");

async function generateTimetable(semester, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date format for startDate or endDate");
  }
  if (start > end) {
    throw new Error("startDate must be before endDate");
  }

  const subjects = await Subject.find({ semester }).sort({
    difficulty: -1,
    subjectName: 1,
  });
  if (!subjects.length) {
    return [];
  }

  const holidays = await Holiday.find();
  const holidayDates = new Set(
    holidays.map((h) => h.date.toISOString().split("T")[0]),
  );

  const validDates = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const day = currentDate.getDay();
    const dateKey = currentDate.toISOString().split("T")[0];
    if (day !== 0 && day !== 6 && !holidayDates.has(dateKey)) {
      validDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (validDates.length < subjects.length) {
    throw new Error(
      "Not enough available exam days in the selected date range",
    );
  }

  const exams = [];
  let lastHighDate = null;

  for (const subject of subjects) {
    let assigned = false;
    for (const date of validDates) {
      const dateKey = date.toISOString().split("T")[0];
      const alreadyAssigned = exams.some(
        (exam) => exam.date.toISOString().split("T")[0] === dateKey,
      );
      if (alreadyAssigned) continue;

      if (subject.difficulty === "Hard") {
        if (lastHighDate) {
          const diffDays = Math.round(
            (date - lastHighDate) / (1000 * 60 * 60 * 24),
          );
          if (diffDays < 2) continue;
        }
        lastHighDate = date;
      }

      exams.push({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        difficulty: subject.difficulty,
        date: new Date(date),
        session: "Morning",
      });
      assigned = true;
      break;
    }

    if (!assigned) {
      throw new Error(
        `Could not assign exam date for subject ${subject.subjectName}`,
      );
    }
  }

  return exams;
}

module.exports = generateTimetable;
