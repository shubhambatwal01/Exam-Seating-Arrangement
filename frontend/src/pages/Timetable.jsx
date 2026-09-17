import { useEffect, useState } from "react";
import api from "../services/axios";
import { useAuth } from "../context/AuthContext";
import {
  Alert,
  Empty,
  PageTitle,
  input,
  panel,
  primary,
} from "../components/UI";
const day = (v) => String(v || "").slice(0, 10);
export default function Timetable() {
  const { user } = useAuth(),
    [sessions, setSessions] = useState([]),
    [sessionId, setSessionId] = useState(""),
    [subjects, setSubjects] = useState([]),
    [selected, setSelected] = useState([]),
    [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [msg, setMsg] = useState("");
  useEffect(() => {
    api.get("/exam-sessions").then((r) => setSessions(r.data.data));
  }, []);
  useEffect(() => {
    if (!sessionId) return;
    Promise.all([
      api.get(`/timetable/subjects/${sessionId}`),
      api.get("/timetable", { params: { examSessionId: sessionId } }),
    ]).then(([a, b]) => {
      setSubjects(a.data.data);
      setRows(b.data.data);
    });
  }, [sessionId]);
  const generate = async () => {
    try {
      setError("");
      const r = await api.post("/timetable/generate", {
        examSessionId: sessionId,
        subjectIds: selected,
      });
      setRows(r.data.data);
      setMsg(r.data.message);
    } catch (e) {
      setError(e.response?.data?.message || "Generation failed.");
    }
  };
  const edit = async (row, field, value) => {
    try {
      const patch = {};
      patch[field] = value;
      const s = sessions.find((x) => x._id === sessionId),
        slot = s?.timeSlots?.find(
          (x) => x.label === (field === "slotLabel" ? value : row.slotLabel),
        );
      if (field === "slotLabel" && slot) {
        patch.startTime = slot.startTime;
        patch.endTime = slot.endTime;
      }
      await api.patch(`/timetable/${row._id}`, patch);
      const r = await api.get("/timetable", {
        params: { examSessionId: sessionId },
      });
      setRows(r.data.data);
    } catch (e) {
      setError(e.response?.data?.message);
    }
  };
  return (
    <>
      <PageTitle
        title="Timetable Generator"
        description="Students' actual subject appearances drive clash detection; current semester is never used as a shortcut."
      />
      <Alert>{error}</Alert>
      <Alert type="success">{msg}</Alert>
      <div className={`${panel} mb-4`}>
        <label className="block max-w-md text-sm">
          Exam Session
          <select
            className={input}
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              setSelected([]);
            }}
          >
            <option value="">Select session</option>
            {sessions.map((x) => (
              <option key={x._id} value={x._id}>
                {x.name} - {x.academicYear}
              </option>
            ))}
          </select>
        </label>
        {sessionId && user?.role === "admin" && (
          <>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s) => (
                <label
                  key={s._id}
                  className="flex items-center gap-2 rounded border p-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(s._id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, s._id]
                          : selected.filter((x) => x !== s._id),
                      )
                    }
                  />
                  <span>
                    <b>{s.code}</b> — {s.name}
                  </span>
                </label>
              ))}
            </div>
            <button
              className={`${primary} mt-3`}
              disabled={!selected.length}
              onClick={generate}
            >
              Generate Conflict-free Timetable
            </button>
          </>
        )}
      </div>
      <div className={`${panel} overflow-x-auto`}>
        {rows.length ? (
          <table className="w-full min-w-212.5 text-sm">
            <thead className="bg-[#cff4fc]">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Slot</th>
                <th className="p-2">Time</th>
                <th className="p-2 text-left">Subject</th>
                <th className="p-2">Mode</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr className="border-b" key={r._id}>
                  <td className="p-2">
                    {user?.role === "admin" ? (
                      <input
                        type="date"
                        className={input}
                        value={day(r.date)}
                        onChange={(e) => edit(r, "date", e.target.value)}
                      />
                    ) : (
                      day(r.date)
                    )}
                  </td>
                  <td className="p-2">
                    {user?.role === "admin" ? (
                      <select
                        className={input}
                        value={r.slotLabel}
                        onChange={(e) => edit(r, "slotLabel", e.target.value)}
                      >
                        {sessions
                          .find((x) => x._id === sessionId)
                          ?.timeSlots?.map((s) => (
                            <option key={s.label}>{s.label}</option>
                          ))}
                      </select>
                    ) : (
                      r.slotLabel
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {r.startTime}-{r.endTime}
                  </td>
                  <td className="p-2">
                    <b>{r.subject?.code}</b> — {r.subject?.name}
                  </td>
                  <td className="p-2 text-center">
                    {r.manualOverride ? "Manual" : "Auto"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty text="Select a session or generate a timetable." />
        )}
      </div>
    </>
  );
}
