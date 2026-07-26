import { useState, useEffect } from "react";
import {
  getSubjects,
  createSubject,
  deleteSubject,
} from "../services/subjectService";

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({
    subjectCode: "",
    subjectName: "",
    semester: "",
    difficulty: "Easy",
  });

  const loadSubjects = async () => {
    const res = await getSubjects();
    setSubjects(res.data);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createSubject(form);
    setForm({
      subjectCode: "",
      subjectName: "",
      semester: "",
      difficulty: "Easy",
    });
    loadSubjects();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-32px border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Subjects
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Manage Subject List
            </h1>
          </div>
          <button className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            Refresh
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 sm:grid-cols-2"
        >
          <input
            value={form.subjectCode}
            placeholder="Subject Code"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, subjectCode: e.target.value })}
          />

          <input
            value={form.subjectName}
            placeholder="Subject Name"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
          />

          <input
            value={form.semester}
            type="number"
            min="1"
            placeholder="Semester"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          />

          <select
            value={form.difficulty}
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          <button className="col-span-full rounded-3xl bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400">
            Add Subject
          </button>
        </form>
      </div>

      <div className="rounded-32px border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
        <h2 className="text-xl font-semibold text-white">Subject List</h2>
        <div className="mt-5 space-y-3">
          {subjects.map((sub) => (
            <div
              key={sub._id}
              className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-white">{sub.subjectName}</p>
                <p className="text-sm text-slate-400">
                  {sub.subjectCode} • Semester {sub.semester} • {sub.difficulty}
                </p>
              </div>
              <button
                className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400"
                onClick={() => deleteSubject(sub._id).then(loadSubjects)}
              >
                Delete
              </button>
            </div>
          ))}
          {!subjects.length && (
            <p className="text-slate-500">
              No subjects yet. Add one to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Subjects;
