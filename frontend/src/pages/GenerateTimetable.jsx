import { useState } from "react";
import { generateTimetable } from "../services/timetableService";

function GenerateTimetable() {
  const [form, setForm] = useState({
    semester: "1",
    startDate: "",
    endDate: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await generateTimetable(form);
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate timetable",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Generate Timetable
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Create Exam Schedules
            </h1>
            <p className="mt-2 text-slate-400">
              Choose the semester range and build a timetable that avoids
              weekends and holidays.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-900/90 px-5 py-3 text-sm text-slate-300 shadow-xl shadow-slate-950/20">
            <p className="font-medium text-cyan-300">Smart generate</p>
            <p className="mt-1 text-slate-500">
              Hard exams are spaced for better student readiness.
            </p>
          </div>
        </div>

        <form
          onSubmit={submitHandler}
          className="mt-8 grid gap-4 sm:grid-cols-3"
        >
          <input
            value={form.semester}
            type="number"
            min="1"
            placeholder="Semester"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          />

          <input
            value={form.startDate}
            type="date"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />

          <input
            value={form.endDate}
            type="date"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />

          <button className="col-span-full rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-blue-400">
            Generate Timetable
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-900/90 p-6 shadow-inner shadow-slate-950/10">
            <h2 className="text-xl font-semibold text-white">
              Generated Exam Plan
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="text-slate-400">Sem</p>
                <p className="mt-2 text-lg font-medium text-white">
                  {form.semester}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="text-slate-400">Date Range</p>
                <p className="mt-2 text-lg font-medium text-white">
                  {form.startDate} → {form.endDate}
                </p>
              </div>
            </div>
            <pre className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-300">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default GenerateTimetable;
