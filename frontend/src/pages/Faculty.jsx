import { useEffect, useState } from "react";
import {
  getFaculties,
  createFaculty,
  deleteFaculty,
} from "../services/facultyService";

function Faculty() {
  const [faculties, setFaculties] = useState([]);
  const [form, setForm] = useState({ facultyName: "", subjectId: "" });

  const loadFaculties = async () => {
    const res = await getFaculties();
    setFaculties(res.data);
  };

  useEffect(() => {
    loadFaculties();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createFaculty(form);
    setForm({ facultyName: "", subjectId: "" });
    loadFaculties();
  };

  const handleDelete = async (id) => {
    await deleteFaculty(id);
    loadFaculties();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-32px border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Faculty
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Faculty Management
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
            value={form.facultyName}
            type="text"
            placeholder="Faculty Name"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, facultyName: e.target.value })}
          />
          <input
            value={form.subjectId}
            type="text"
            placeholder="Subject ID"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
          />
          <button className="col-span-full rounded-3xl bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400">
            Add Faculty
          </button>
        </form>
      </div>

      <div className="rounded-32px border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <h2 className="text-xl font-semibold text-white">Faculty List</h2>
        <div className="mt-5 space-y-3">
          {faculties.map((faculty) => (
            <div
              key={faculty._id}
              className="flex flex-col gap-2 rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-white">
                  {faculty.facultyName}
                </p>
                <p className="text-sm text-slate-400">
                  Assigned subject: {faculty.subjectId}
                </p>
              </div>
              <button
                className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400"
                onClick={() => handleDelete(faculty._id)}
              >
                Delete
              </button>
            </div>
          ))}
          {!faculties.length && (
            <p className="text-slate-500">No faculty records yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Faculty;
