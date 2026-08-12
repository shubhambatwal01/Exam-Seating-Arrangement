import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function ExamSettings() {
  const [settings, setSettings] = useState({
    examType: "Midterm",
    startDate: "",
    endDate: "",
    sessionsPerDay: 2,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(settings);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-32px border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Exam Settings
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Schedule Options
            </h1>
          </div>
          <button className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            Save Settings
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 sm:grid-cols-2"
        >
          <input
            value={settings.examType}
            type="text"
            placeholder="Exam Type"
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) =>
              setSettings({ ...settings, examType: e.target.value })
            }
          />

          <DatePicker
            selected={
              settings.startDate
                ? new Date(settings.startDate + "T00:00:00")
                : null
            }
            minDate={new Date()}
            onChange={(date) => {
              if (!date) {
                setSettings({ ...settings, startDate: "" });
                return;
              }

              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");

              setSettings({
                ...settings,
                startDate: `${year}-${month}-${day}`,
              });
            }}
            dateFormat="dd/MM/yyyy"
            placeholderText="Select start date"
            className="w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            required
          />

          <DatePicker
            selected={
              settings.endDate ? new Date(settings.endDate + "T00:00:00") : null
            }
            minDate={
              settings.startDate
                ? new Date(settings.startDate + "T00:00:00")
                : new Date()
            }
            onChange={(date) => {
              if (!date) {
                setSettings({ ...settings, endDate: "" });
                return;
              }

              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");

              setSettings({
                ...settings,
                endDate: `${year}-${month}-${day}`,
              });
            }}
            dateFormat="dd/MM/yyyy"
            placeholderText="Select end date"
            className="w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            required
          />

          <select
            value={settings.sessionsPerDay}
            className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            onChange={(e) =>
              setSettings({
                ...settings,
                sessionsPerDay: Number(e.target.value),
              })
            }
          >
            <option value={1}>1 Session per day</option>
            <option value={2}>2 Sessions per day</option>
            <option value={3}>3 Sessions per day</option>
          </select>
        </form>
      </div>
    </div>
  );
}

export default ExamSettings;
