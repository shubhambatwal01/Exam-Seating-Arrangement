import { useEffect, useState } from "react";
import api from "../services/axios";
import { Alert, PageTitle, input, panel, primary } from "../components/UI";
export default function Settings() {
  const [form, setForm] = useState({
      defaultExamDuration: 120,
      defaultBacklogMode: "intersperse",
      minGapBetweenSameSubject: 1,
    }),
    [msg, setMsg] = useState("");
  useEffect(() => {
    api.get("/settings").then((r) => setForm(r.data.data));
  }, []);
  const save = async (e) => {
    e.preventDefault();
    const r = await api.patch("/settings", form);
    setMsg(r.data.message);
  };
  return (
    <>
      <PageTitle
        title="System Settings"
        description="Global defaults; an exam session can override seating rules for a specific examination."
      />
      <Alert type="success">{msg}</Alert>
      <form
        onSubmit={save}
        className={`${panel} grid max-w-3xl gap-4 md:grid-cols-3`}
      >
        <label className="text-sm">
          Default Exam Duration
          <input
            type="number"
            className={input}
            value={form.defaultExamDuration || 120}
            onChange={(e) =>
              setForm({ ...form, defaultExamDuration: Number(e.target.value) })
            }
          />
        </label>
        <label className="text-sm">
          Backlog Seating
          <select
            className={input}
            value={form.defaultBacklogMode || "intersperse"}
            onChange={(e) =>
              setForm({ ...form, defaultBacklogMode: e.target.value })
            }
          >
            <option value="intersperse">Intersperse</option>
            <option value="separate">Separate priority</option>
          </select>
        </label>
        <label className="text-sm">
          Minimum Same-subject Gap
          <input
            type="number"
            min="0"
            max="5"
            className={input}
            value={form.minGapBetweenSameSubject ?? 1}
            onChange={(e) =>
              setForm({
                ...form,
                minGapBetweenSameSubject: Number(e.target.value),
              })
            }
          />
        </label>
        <button className={primary}>Save Settings</button>
      </form>
    </>
  );
}
