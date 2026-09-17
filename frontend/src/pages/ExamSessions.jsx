import { useEffect, useState } from "react";
import api from "../services/axios";
import { useAuth } from "../context/AuthContext";
import {
  Alert,
  Empty,
  PageTitle,
  danger,
  input,
  panel,
  primary,
} from "../components/UI";

const emptyForm = {
  name: "",
  academicYear: "2026-27",
  startDate: "",
  endDate: "",
  status: "draft",
  morningStart: "10:00",
  morningEnd: "12:00",
  afternoonStart: "14:00",
  afternoonEnd: "16:00",
};

export default function ExamSessions() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    const response = await api.get("/exam-sessions");
    setItems(response.data.data);
  };

  useEffect(() => {
    load().catch((err) =>
      setError(err.response?.data?.message || "Unable to load sessions."),
    );
  }, []);

  const payload = () => ({
    name: form.name,
    academicYear: form.academicYear,
    startDate: form.startDate,
    endDate: form.endDate,
    status: form.status,
    timeSlots: [
      {
        label: "Morning",
        startTime: form.morningStart,
        endTime: form.morningEnd,
      },
      {
        label: "Afternoon",
        startTime: form.afternoonStart,
        endTime: form.afternoonEnd,
      },
    ],
  });

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      if (editingId) await api.patch(`/exam-sessions/${editingId}`, payload());
      else await api.post("/exam-sessions", payload());
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save exam session.");
    }
  };

  const edit = (item) => {
    const morning =
      item.timeSlots?.find((slot) => slot.label === "Morning") || {};
    const afternoon =
      item.timeSlots?.find((slot) => slot.label === "Afternoon") || {};
    setEditingId(item._id);
    setForm({
      name: item.name,
      academicYear: item.academicYear,
      startDate: String(item.startDate).slice(0, 10),
      endDate: String(item.endDate).slice(0, 10),
      status: item.status,
      morningStart: morning.startTime || "10:00",
      morningEnd: morning.endTime || "12:00",
      afternoonStart: afternoon.startTime || "14:00",
      afternoonEnd: afternoon.endTime || "16:00",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (item) => {
    if (
      !window.confirm(
        `Delete ${item.name}? Generated timetable/seating for this session will also be deleted.`,
      )
    )
      return;
    try {
      await api.delete(`/exam-sessions/${item._id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete session.");
    }
  };

  return (
    <>
      <PageTitle
        title="Exam Sessions"
        description="Configure examination dates, time slots and publication status."
      />
      <Alert>{error}</Alert>

      {user?.role === "admin" && (
        <form
          className={`${panel} mb-4 grid gap-3 md:grid-cols-4`}
          onSubmit={submit}
        >
          <label className="text-sm md:col-span-2">
            Session Name
            <input
              className={input}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
          </label>
          <label className="text-sm">
            Academic Year
            <input
              className={input}
              value={form.academicYear}
              onChange={(event) =>
                setForm({ ...form, academicYear: event.target.value })
              }
              required
            />
          </label>
          <label className="text-sm">
            Status
            <select
              className={input}
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value })
              }
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="text-sm">
            Start Date
            <input
              type="date"
              className={input}
              value={form.startDate}
              onChange={(event) =>
                setForm({ ...form, startDate: event.target.value })
              }
              required
            />
          </label>
          <label className="text-sm">
            End Date
            <input
              type="date"
              className={input}
              value={form.endDate}
              onChange={(event) =>
                setForm({ ...form, endDate: event.target.value })
              }
              required
            />
          </label>
          <label className="text-sm">
            Morning
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                className={input}
                value={form.morningStart}
                onChange={(e) =>
                  setForm({ ...form, morningStart: e.target.value })
                }
              />
              <input
                type="time"
                className={input}
                value={form.morningEnd}
                onChange={(e) =>
                  setForm({ ...form, morningEnd: e.target.value })
                }
              />
            </div>
          </label>
          <label className="text-sm">
            Afternoon
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                className={input}
                value={form.afternoonStart}
                onChange={(e) =>
                  setForm({ ...form, afternoonStart: e.target.value })
                }
              />
              <input
                type="time"
                className={input}
                value={form.afternoonEnd}
                onChange={(e) =>
                  setForm({ ...form, afternoonEnd: e.target.value })
                }
              />
            </div>
          </label>
          <div className="flex items-end gap-2 md:col-span-4">
            <button className={primary}>
              {editingId ? "Update Session" : "Create Session"}
            </button>
            {editingId && (
              <button
                type="button"
                className={danger}
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className={panel}>
        {items.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div className="rounded border p-3" key={item._id}>
                <div className="font-semibold">{item.name}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {item.academicYear}
                </div>
                <div className="mt-2 text-sm">
                  {String(item.startDate).slice(0, 10)} →{" "}
                  {String(item.endDate).slice(0, 10)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {(item.timeSlots || [])
                    .map(
                      (slot) =>
                        `${slot.label} ${slot.startTime}-${slot.endTime}`,
                    )
                    .join(" • ")}
                </div>
                <span className="mt-2 inline-block rounded bg-[#cff4fc] px-2 py-1 text-xs uppercase">
                  {item.status}
                </span>
                {user?.role === "admin" && (
                  <div className="mt-3 flex gap-2">
                    <button className={primary} onClick={() => edit(item)}>
                      Edit
                    </button>
                    <button className={danger} onClick={() => remove(item)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </div>
    </>
  );
}
