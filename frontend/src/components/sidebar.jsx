import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Subjects", path: "/subjects" },
  { label: "Students", path: "/students" },
  { label: "Faculty", path: "/faculty" },
  { label: "Exam Settings", path: "/exam-settings" },
  { label: "Generate Timetable", path: "/generate-timetable" },
  { label: "Timetable", path: "/timetable" },
];

function Sidebar() {
  const location = useLocation();

  return (
    <div className="space-y-8 text-slate-200">
      <div className="rounded-[28px] border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/25 backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
          Exam Scheduler
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          ESA
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          A modern timetable manager for courses, faculty, and exam schedules.
        </p>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-md">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-slate-500">
          Navigation
        </p>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-cyan-500 text-slate-950 shadow-xl shadow-cyan-500/20"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tip</p>
        <p className="mt-3 text-sm text-slate-300">
          Use the generate page to build a timetable and then review the
          schedule in the timetable view.
        </p>
      </div>
    </div>
  );
}

export default Sidebar;
