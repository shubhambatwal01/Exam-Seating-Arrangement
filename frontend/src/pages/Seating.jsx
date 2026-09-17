import { useEffect, useMemo, useState } from "react";
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
const colors = [
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-yellow-50 border-yellow-200",
  "bg-purple-50 border-purple-200",
  "bg-rose-50 border-rose-200",
  "bg-cyan-50 border-cyan-200",
];
export default function Seating() {
  const { user } = useAuth(),
    [sessions, setSessions] = useState([]),
    [rooms, setRooms] = useState([]),
    [form, setForm] = useState({
      examSessionId: "",
      date: "",
      slotLabel: "Morning",
      classroomIds: [],
      backlogMode: "intersperse",
      minGap: 1,
    }),
    [arrangements, setArrangements] = useState([]),
    [error, setError] = useState(""),
    [msg, setMsg] = useState("");
  useEffect(() => {
    Promise.all([api.get("/exam-sessions"), api.get("/classrooms")]).then(
      ([a, b]) => {
        setSessions(a.data.data);
        setRooms(b.data.data.items || []);
      },
    );
  }, []);
  const session = sessions.find((x) => x._id === form.examSessionId);
  useEffect(() => {
    if (
      session?.timeSlots?.length &&
      !session.timeSlots.some((x) => x.label === form.slotLabel)
    )
      setForm((f) => ({ ...f, slotLabel: session.timeSlots[0].label }));
  }, [form.examSessionId]);
  const subjectColors = useMemo(() => {
    const codes = [
      ...new Set(
        arrangements.flatMap((a) =>
          a.seatMap.map((s) => s.subjectCode).filter(Boolean),
        ),
      ),
    ];
    return new Map(codes.map((c, i) => [c, colors[i % colors.length]]));
  }, [arrangements]);
  const generate = async () => {
    try {
      setError("");
      const r = await api.post("/seating/generate", form);
      setArrangements(r.data.data);
      setMsg(r.data.message);
    } catch (e) {
      setError(e.response?.data?.message || "Seating generation failed.");
    }
  };
  const load = async () => {
    if (!form.examSessionId) return;
    const r = await api.get("/seating", {
      params: {
        examSessionId: form.examSessionId,
        date: form.date || undefined,
        slotLabel: form.slotLabel || undefined,
      },
    });
    setArrangements(r.data.data);
  };
  const attendance = async (a, seat, value) => {
    await api.patch(`/seating/${a._id}/attendance`, {
      seatNo: seat.seatNo,
      attendance: value,
    });
    setArrangements((xs) =>
      xs.map((x) =>
        x._id !== a._id
          ? x
          : {
              ...x,
              seatMap: x.seatMap.map((s) =>
                s.seatNo === seat.seatNo ? { ...s, attendance: value } : s,
              ),
            },
      ),
    );
  };
  return (
    <>
      <PageTitle
        title="Seating Arrangement"
        description="Fresh and backlog appearances are seated by subject; orthogonally adjacent occupied seats never share the same subject code."
      />
      <Alert>{error}</Alert>
      <Alert type="success">{msg}</Alert>
      <div className={`${panel} mb-4 grid gap-3 md:grid-cols-4`}>
        <label className="text-sm">
          Exam Session
          <select
            className={input}
            value={form.examSessionId}
            onChange={(e) =>
              setForm({ ...form, examSessionId: e.target.value })
            }
          >
            <option value="">Select</option>
            {sessions.map((x) => (
              <option key={x._id} value={x._id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Exam Date
          <input
            type="date"
            className={input}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Slot
          <select
            className={input}
            value={form.slotLabel}
            onChange={(e) => setForm({ ...form, slotLabel: e.target.value })}
          >
            {(
              session?.timeSlots || [
                { label: "Morning" },
                { label: "Afternoon" },
              ]
            ).map((x) => (
              <option key={x.label}>{x.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Backlog Mode
          <select
            className={input}
            value={form.backlogMode}
            onChange={(e) => setForm({ ...form, backlogMode: e.target.value })}
          >
            <option value="intersperse">Intersperse</option>
            <option value="separate">Separate priority</option>
          </select>
        </label>
        <label className="text-sm">
          Minimum Subject Gap
          <input
            type="number"
            min="0"
            max="5"
            className={input}
            value={form.minGap}
            onChange={(e) =>
              setForm({ ...form, minGap: Number(e.target.value) })
            }
          />
        </label>
        <div className="md:col-span-3">
          <p className="mb-1 text-sm">Classrooms</p>
          <div className="flex flex-wrap gap-2">
            {rooms.map((r) => (
              <label key={r._id} className="rounded border px-2 py-1 text-sm">
                <input
                  className="mr-2"
                  type="checkbox"
                  checked={form.classroomIds.includes(r._id)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      classroomIds: e.target.checked
                        ? [...form.classroomIds, r._id]
                        : form.classroomIds.filter((x) => x !== r._id),
                    })
                  }
                />
                {r.roomNo} ({r.capacity})
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2 md:col-span-4">
          {user?.role === "admin" && (
            <button className={primary} onClick={generate}>
              Generate Seating
            </button>
          )}
          <button className={primary} onClick={load}>
            Load Existing
          </button>
          <button className={primary} onClick={() => window.print()}>
            Print View
          </button>
        </div>
      </div>
      {arrangements.length ? (
        arrangements.map((a) => (
          <div key={a._id} className={`${panel} mb-4 break-inside-avoid`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">
                  Room {a.classroom?.roomNo}
                </h2>
                <p className="text-xs text-slate-500">
                  {a.classroom?.building} • {String(a.date).slice(0, 10)} •{" "}
                  {a.timeSlot}
                </p>
              </div>
              <a
                className={`${primary} no-print`}
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
                  const r = await api.get(`/reports/seating/${a._id}.pdf`, {
                    responseType: "blob",
                  });
                  window.open(URL.createObjectURL(r.data), "_blank");
                }}
              >
                PDF
              </a>
            </div>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${a.classroom?.columns || 1},minmax(92px,1fr))`,
              }}
            >
              {a.seatMap.map((s) => (
                <div
                  key={s.seatNo}
                  className={`min-h-[86px] rounded border p-2 text-xs ${s.studentId ? subjectColors.get(s.subjectCode) : "bg-slate-50 border-slate-200"}`}
                >
                  <div className="font-semibold">{s.seatNo}</div>
                  {s.studentId ? (
                    <>
                      <div className="mt-1">{s.rollNo}</div>
                      <div className="font-bold">{s.subjectCode}</div>
                      <div className="capitalize text-slate-500">
                        {s.appearanceType}
                      </div>
                      <select
                        className="no-print mt-1 w-full rounded border bg-white p-1"
                        value={s.attendance}
                        onChange={(e) => attendance(a, s, e.target.value)}
                      >
                        <option value="unmarked">Unmarked</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                      </select>
                    </>
                  ) : (
                    <div className="mt-4 text-center text-slate-400">EMPTY</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className={panel}>
          <Empty text="Generate or load a seating arrangement." />
        </div>
      )}
    </>
  );
}
