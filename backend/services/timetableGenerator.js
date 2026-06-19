const Subject = require("../models/subject");

const Holiday = require("../models/holiday");

async function generateTimetable(semester, startDate, endDate) {
  const subjects = await Subject.find({
    semester,
  });

  const holidays = await Holiday.find();

  const holidayDates = holidays.map((h) => h.date.toISOString().split("T")[0]);

  const exams = [];

  let currentDate = new Date(startDate);

  let previousHighDifficultyDate = null;

  for (let subject of subjects) {
    while (true) {
      const dateString = currentDate.toISOString().split("T")[0];

      const day = currentDate.getDay();

      const isSunday = day === 0;

      const isHoliday = holidayDates.includes(dateString);

      if (!isSunday && !isHoliday) {
        if (subject.difficulty === "High") {
          if (previousHighDifficultyDate) {
            const diff =
              (currentDate - previousHighDifficultyDate) /
              (1000 * 60 * 60 * 24);

            if (diff < 2) {
              currentDate.setDate(currentDate.getDate() + 1);

              continue;
            }
          }

          previousHighDifficultyDate = new Date(currentDate);
        }

        exams.push({
          subjectCode: subject.subjectCode,

          subjectName: subject.subjectName,

          difficulty: subject.difficulty,

          date: new Date(currentDate),

          session: "Morning",
        });

        currentDate.setDate(currentDate.getDate() + 1);

        break;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return exams;
}

module.exports = generateTimetable;
