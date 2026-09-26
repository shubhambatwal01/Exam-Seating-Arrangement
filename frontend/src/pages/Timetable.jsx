import { useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCcw } from "lucide-react";
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

const day = (value) => String(value || "").slice(0, 10);

const formatDate = (value) => {
  const raw = day(value);
  if (!raw) return "";
  const [year, month, date] = raw.split("-");
  return `${date}.${month}.${year}`;
};

export default function Timetable() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [rows, setRows] = useState([]);
  const [formation, setFormation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api
      .get("/exam-sessions")
      .then((response) => setSessions(response.data.data))
      .catch((err) =>
        setError(
          err.response?.data?.message || "Unable to load exam sessions.",
        ),
      );
  }, []);

  const loadSessionData = async (id = sessionId) => {
    if (!id) {
      setSubjects([]);
      setRows([]);
      setFormation([]);
      return;
    }

    setLoading(true);
    try {
      const [subjectsResponse, timetableResponse, formationResponse] =
        await Promise.all([
          api.get(`/timetable/subjects/${id}`),
          api.get("/timetable", { params: { examSessionId: id } }),
          api.get("/timetable/formation", {
            params: { examSessionId: id },
          }),
        ]);

      setSubjects(subjectsResponse.data.data);
      setRows(timetableResponse.data.data);
      setFormation(formationResponse.data.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load timetable data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    loadSessionData(sessionId);
  }, [sessionId]);

  const generate = async () => {
    try {
      setError("");
      setMsg("");
      setLoading(true);
      const response = await api.post("/timetable/generate", {
        examSessionId: sessionId,
        subjectIds: selected,
      });
      setRows(response.data.data);
      setMsg(
        "Conflict-free timetable generated. The institutional formation below is ready for PDF/Excel export.",
      );
      await loadSessionData(sessionId);
    } catch (err) {
      setError(err.response?.data?.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const edit = async (row, field, value) => {
    try {
      setError("");
      const patch = { [field]: value };
      await api.patch(`/timetable/${row._id}`, patch);
      await loadSessionData(sessionId);
      setMsg("Timetable entry updated and revalidated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update timetable.");
    }
  };

  const download = async (path, name, open = false) => {
    try {
      setError("");
      const response = await api.get(path, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      if (open) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to download report.");
    }
  };

  const groups = useMemo(() => {
    const map = new Map();
    formation.forEach((row) => {
      const key = `${row.isoDate}|${row.slotLabel}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          date: row.date,
          slotLabel: row.slotLabel,
          startTime: row.startTime,
          endTime: row.endTime,
          rows: [],
        });
      }
      map.get(key).rows.push(row);
    });
    return [...map.values()];
  }, [formation]);

  const currentSession = sessions.find((item) => item._id === sessionId);
  const allSelected =
    subjects.length > 0 && selected.length === subjects.length;

  return (
    <>
      <PageTitle
        title="Timetable Generator"
        description="Generate a clash-free exam schedule and view it in the same institutional formation used for Modern College examination room planning."
      />

      <Alert>{error}</Alert>
      <Alert type="success">{msg}</Alert>

      <div className={`${panel} mb-4`}>
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,420px)_1fr] lg:items-end">
          <label className="text-sm">
            Exam Session
            <select
              className={input}
              value={sessionId}
              onChange={(event) => {
                setSessionId(event.target.value);
                setSelected([]);
                setMsg("");
              }}
            >
              <option value="">Select session</option>
              {sessions.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} - {item.academicYear}
                </option>
              ))}
            </select>
          </label>

          {sessionId && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={primary}
                onClick={() => loadSessionData(sessionId)}
                disabled={loading}
              >
                <span className="inline-flex items-center gap-2">
                  <RefreshCcw size={15} />
                  Refresh Formation
                </span>
              </button>
              <button
                type="button"
                className={primary}
                onClick={() =>
                  download(
                    `/reports/timetable/${sessionId}.pdf`,
                    "exam-timetable.pdf",
                    true,
                  )
                }
              >
                <span className="inline-flex items-center gap-2">
                  <FileText size={15} />
                  Timetable PDF
                </span>
              </button>
              <button
                type="button"
                className={primary}
                onClick={() =>
                  download(
                    `/reports/timetable/${sessionId}.xlsx`,
                    "exam-timetable.xlsx",
                  )
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Download size={15} />
                  Timetable Excel
                </span>
              </button>
            </div>
          )}
        </div>

        {sessionId && user?.role === "admin" && (
          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-slate-800">
                  Select Examination Subjects
                </h2>
                <p className="text-xs text-slate-500">
                  Shared fresh/backlog candidates are never placed in the same
                  time slot. Same-class papers are spread across dates whenever
                  possible.
                </p>
              </div>
              <button
                type="button"
                className={primary}
                onClick={() =>
                  setSelected(
                    allSelected ? [] : subjects.map((item) => item._id),
                  )
                }
              >
                {allSelected ? "Clear All" : "Select All"}
              </button>
            </div>

            <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {subjects.map((subject) => (
                <label
                  key={subject._id}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-slate-50/70 p-2.5 text-sm transition hover:border-cyan-300 hover:bg-cyan-50/50"
                >
                  <input
                    className="mt-1"
                    type="checkbox"
                    checked={selected.includes(subject._id)}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? [...selected, subject._id]
                          : selected.filter((id) => id !== subject._id),
                      )
                    }
                  />
                  <span>
                    <b>{subject.code}</b> — {subject.name}
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {subject.course?.code || subject.course?.name || "Course"}
                      {subject.semester?.number
                        ? ` • Sem ${subject.semester.number}`
                        : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <button
              className={`${primary} mt-3`}
              disabled={!selected.length || loading}
              onClick={generate}
              type="button"
            >
              {loading ? "Generating..." : "Generate Conflict-free Timetable"}
            </button>
          </div>
        )}
      </div>

      <div className={`${panel} mb-4`}>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Institutional Timetable Formation
            </h2>
            <p className="text-xs text-slate-500">
              Mirrors the supplied college skeleton: Class, Sub Code, Sem,
              Subject, Strength, Block No and Room No. Block/room values appear
              after seating is generated.
            </p>
          </div>
          {currentSession && (
            <div className="rounded-md bg-cyan-50 px-3 py-2 text-right text-xs text-cyan-900">
              <div className="font-semibold">{currentSession.name}</div>
              <div>{currentSession.academicYear}</div>
            </div>
          )}
        </div>

        {groups.length ? (
          <div className="space-y-5">
            {groups.map((group) => (
              <section
                key={group.key}
                className="overflow-hidden rounded-md border border-slate-300 bg-white"
              >
                <div className="border-b border-slate-300 bg-white px-4 py-3 text-center">
                  <div className="text-xs font-semibold">
                    Progressive Education Society&apos;s
                  </div>
                  <div className="text-base font-bold sm:text-lg">
                    Modern College of Arts, Science & Commerce
                  </div>
                  <div className="text-xs">Ganeshkhind, Pune - 411016</div>
                  <div className="mt-1 text-xs font-semibold text-red-600">
                    Autonomous • {currentSession?.name} •{" "}
                    {currentSession?.academicYear}
                  </div>
                  <h3 className="mt-2 text-xl font-bold">
                    {group.slotLabel} Session
                  </h3>
                  <div className="mt-2 flex flex-wrap justify-between gap-2 text-left text-sm font-semibold">
                    <span>Date : {formatDate(group.date)}</span>
                    <span>
                      Time : {group.startTime} to {group.endTime}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] border-collapse text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        {[
                          "Class",
                          "Sub Code",
                          "Sem",
                          "Subject",
                          "Strength",
                          "Block No",
                          "Room No",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="border border-slate-300 px-2 py-2 text-center font-semibold"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row, index) => (
                        <tr
                          key={`${row.timetableId}-${row.roomNo}-${row.blockNo}-${index}`}
                        >
                          <td className="border border-slate-300 px-2 py-2 text-center">
                            {row.className}
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-medium">
                            {row.subjectCode}
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-center">
                            {row.semesterRoman}
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            {row.subjectName}
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-semibold text-red-600">
                            {row.allocationStrength}
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-center">
                            {row.blockNo}
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-center">
                            {row.roomNo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <Empty text="Select a session and generate a timetable to view the institutional formation." />
        )}
      </div>

      <div className={`${panel} overflow-x-auto`}>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Editable Timetable Entries
          </h2>
          <p className="text-xs text-slate-500">
            Admin edits are validated again on the server before they are saved.
          </p>
        </div>

        {rows.length ? (
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-[#cff4fc]">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Slot</th>
                <th className="p-2">Time</th>
                <th className="p-2 text-left">Class</th>
                <th className="p-2 text-left">Subject</th>
                <th className="p-2">Mode</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-b" key={row._id}>
                  <td className="p-2">
                    {user?.role === "admin" ? (
                      <input
                        type="date"
                        className={input}
                        value={day(row.date)}
                        onChange={(event) =>
                          edit(row, "date", event.target.value)
                        }
                      />
                    ) : (
                      formatDate(row.date)
                    )}
                  </td>
                  <td className="p-2">
                    {user?.role === "admin" ? (
                      <select
                        className={input}
                        value={row.slotLabel}
                        onChange={(event) =>
                          edit(row, "slotLabel", event.target.value)
                        }
                      >
                        {currentSession?.timeSlots?.map((slot) => (
                          <option key={slot.label} value={slot.label}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      row.slotLabel
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {row.startTime}-{row.endTime}
                  </td>
                  <td className="p-2">
                    {row.subject?.course?.name ||
                      row.subject?.course?.code ||
                      "-"}
                    {row.subject?.semester?.number
                      ? ` • Sem ${row.subject.semester.number}`
                      : ""}
                  </td>
                  <td className="p-2">
                    <b>{row.subject?.code}</b> — {row.subject?.name}
                  </td>
                  <td className="p-2 text-center">
                    {row.manualOverride ? "Manual" : "Auto"}
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
