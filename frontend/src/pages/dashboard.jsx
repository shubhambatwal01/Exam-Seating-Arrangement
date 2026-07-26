function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-32px border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Welcome back
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              Exam Scheduler Overview
            </h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Manage subjects, students, faculty, exam settings, and
              auto-generated timetables from one place.
            </p>
          </div>
          <div className="rounded-3xl bg-linear-to-br from-slate-900/80 to-slate-800/90 px-6 py-4 text-slate-100 shadow-2xl shadow-slate-950/20">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Next release
            </p>
            <p className="mt-2 text-xl font-semibold">
              Calendar export & PDF timetable
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            label: "Subjects",
            value: "24",
            accent: "bg-cyan-500/10 text-cyan-200",
          },
          {
            label: "Students",
            value: "184",
            accent: "bg-amber-500/10 text-amber-200",
          },
          {
            label: "Faculty",
            value: "18",
            accent: "bg-violet-500/10 text-violet-200",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-[28px] border border-white/10 p-6 ${card.accent} shadow-xl shadow-slate-950/10`}
          >
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              {card.label}
            </p>
            <p className="mt-4 text-4xl font-semibold text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
