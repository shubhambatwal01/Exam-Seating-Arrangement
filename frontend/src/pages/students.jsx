import { useState, useEffect } from "react";
import {
  getStudents,
  createStudent,
  deleteStudent,
} from "../services/studentService";

function Students() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    prn: "",
    name: "",
    email: "",
    semester: "",
    courseId: "",
  });

  const loadStudents = async () => {
    const res = await getStudents();
    setStudents(res.data);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createStudent(form);
    setForm({ prn: "", name: "", email: "", semester: "", courseId: "" });
    loadStudents();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-32px border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Students
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Student Registry
            </h1>
          </div>
          <button className="rounded-3xl bg-linear-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-blue-400">
            Refresh
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 sm:grid-cols-2"
        >
          <input
            value={form.prn}
            placeholder="PRN Number"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, prn: e.target.value })}
          />
          <input
            value={form.name}
            placeholder="Full Name"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            value={form.email}
            type="email"
            placeholder="Email"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            value={form.semester}
            type="number"
            min="1"
            placeholder="Semester"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          />
          <input
            value={form.courseId}
            placeholder="Course ID"
            className="col-span-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
          />
          <button className="col-span-full rounded-3xl bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400">
            Add Student
          </button>
        </form>
      </div>

      <div className="rounded-32px border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <h2 className="text-xl font-semibold text-white">Student List</h2>
        <div className="mt-5 space-y-3">
          {students.map((student) => (
            <div
              key={student._id}
              className="flex flex-col gap-2 rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-base font-semibold text-white">
                  {student.name}
                </p>
                <p className="text-sm text-slate-400">{student.email}</p>
              </div>
              <button
                className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400"
                onClick={() => deleteStudent(student._id).then(loadStudents)}
              >
                Delete
              </button>
            </div>
          ))}
          {!students.length && (
            <p className="text-slate-500">No students added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Students;
