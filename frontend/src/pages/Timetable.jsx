import { useEffect, useState } from "react";
import { getTimetable } from "../services/timetableService";

function Timetable() {
  const [data, setData] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await getTimetable();
    setData(res);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Exam Timetable
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Generated Schedule
            </h1>
          </div>
          <button
            className="rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-blue-400"
            onClick={load}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-slate-950/30">
        <table className="min-w-full divide-y divide-slate-800 text-left">
          <thead className="bg-slate-900/90 text-slate-400">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em]">
                Subject
              </th>
              <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em]">
                Date
              </th>
              <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em]">
                Session
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/80">
            {data.length ? (
              data.flatMap((tt) =>
                tt.exams.map((exam) => (
                  <tr
                    key={`${tt._id}-${exam.subjectCode}-${exam.date}`}
                    className="border-b border-slate-800 hover:bg-slate-900/80"
                  >
                    <td className="px-6 py-4 text-sm text-slate-100">
                      {exam.subjectName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {new Date(exam.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {exam.session}
                    </td>
                  </tr>
                )),
              )
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No timetable found yet. Generate one to see it here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Timetable;
