import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import {
  User,
  Department,
  Course,
  Semester,
  Subject,
  Classroom,
  Faculty,
  Student,
  ExamSession,
} from "./models/index.js";
const up = (M, f, d) =>
  M.findOneAndUpdate(
    f,
    { $set: d },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
async function seed() {
  await connectDB();
  await up(
    User,
    { email: "admin@example.com" },
    {
      name: "System Administrator",
      email: "admin@example.com",
      passwordHash: await bcrypt.hash("Admin@123", 12),
      role: "admin",
      active: true,
    },
  );
  const cs = await up(
      Department,
      { code: "CS" },
      { name: "Computer Science", code: "CS" },
    ),
    ca = await up(
      Department,
      { code: "CA" },
      { name: "Computer Applications", code: "CA" },
    );
  const mcs = await up(
      Course,
      { code: "MCS" },
      {
        name: "M.Sc. Computer Science",
        code: "MCS",
        department: cs._id,
        duration: 2,
      },
    ),
    mca = await up(
      Course,
      { code: "MCA" },
      {
        name: "M.Sc. Computer Applications",
        code: "MCA",
        department: ca._id,
        duration: 2,
      },
    );
  const sem = {};
  for (const c of [mcs, mca])
    for (let n = 1; n <= 4; n++)
      sem[`${c.code}-${n}`] = await up(
        Semester,
        { course: c._id, number: n },
        { course: c._id, number: n },
      );
  const data = [
      ["CS101", "Programming Fundamentals", "MCS", 1, cs, mcs],
      ["CS102", "Database Systems", "MCS", 1, cs, mcs],
      ["CS201", "Advanced JavaScript", "MCS", 2, cs, mcs],
      ["CS202", "Data Structures", "MCS", 2, cs, mcs],
      ["CS301", "Data Science", "MCS", 3, cs, mcs],
      ["CS302", "Machine Learning", "MCS", 3, cs, mcs],
      ["CS303", "Software Testing", "MCS", 3, cs, mcs],
      ["CS304", "Mobile Technologies", "MCS", 3, cs, mcs],
      ["CS401", "Cloud Computing", "MCS", 4, cs, mcs],
      ["CA301", "Web Application Development", "MCA", 3, ca, mca],
      ["CA302", "Enterprise Systems", "MCA", 3, ca, mca],
    ],
    sub = {};
  for (const [c, n, cc, s, d, course] of data)
    sub[c] = await up(
      Subject,
      { code: c },
      {
        code: c,
        name: n,
        department: d._id,
        course: course._id,
        semester: sem[`${cc}-${s}`]._id,
        duration: 120,
      },
    );
  for (const room of [
    {
      roomNo: "A-101",
      building: "Main Building",
      capacity: 30,
      rows: 5,
      columns: 6,
    },
    {
      roomNo: "A-102",
      building: "Main Building",
      capacity: 30,
      rows: 5,
      columns: 6,
    },
    {
      roomNo: "B-201",
      building: "Science Block",
      capacity: 24,
      rows: 4,
      columns: 6,
    },
  ])
    await up(Classroom, { roomNo: room.roomNo }, room);
  await up(
    Faculty,
    { email: "faculty.cs@example.com" },
    {
      name: "Sample CS Faculty",
      email: "faculty.cs@example.com",
      department: cs._id,
      designation: "Assistant Professor",
      active: true,
    },
  );
  for (let i = 1; i <= 12; i++)
    await up(
      Student,
      { rollNo: `MCS${String(i).padStart(3, "0")}` },
      {
        rollNo: `MCS${String(i).padStart(3, "0")}`,
        name: `Sample Student ${i}`,
        semester: sem["MCS-3"]._id,
        department: cs._id,
        course: mcs._id,
        type: "fresh",
        subjects: [sub.CS301._id, sub.CS302._id, sub.CS303._id, sub.CS304._id],
        active: true,
      },
    );
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 5);
  await up(
    ExamSession,
    { name: "Sample Semester Examination" },
    {
      name: "Sample Semester Examination",
      academicYear: "2026-27",
      startDate: start,
      endDate: end,
      status: "draft",
      timeSlots: [
        { label: "Morning", startTime: "10:00", endTime: "12:00" },
        { label: "Afternoon", startTime: "14:00", endTime: "16:00" },
      ],
      seatingRules: { minGap: 1, backlogMode: "intersperse" },
    },
  );
  console.log("Seed completed. Login: admin@example.com / Admin@123");
}
seed()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
