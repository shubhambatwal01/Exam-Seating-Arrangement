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

const configs = {
  departments: {
    title: "Departments",
    fields: [
      ["name", "Department Name"],
      ["code", "Code"],
    ],
  },
  courses: {
    title: "Courses",
    fields: [
      ["name", "Course Name"],
      ["code", "Code"],
      ["department", "Department", "departments"],
      ["duration", "Duration (years)", "number"],
    ],
  },
  semesters: {
    title: "Semesters",
    fields: [
      ["number", "Semester Number", "number"],
      ["course", "Course", "courses"],
    ],
  },
  subjects: {
    title: "Subjects",
    fields: [
      ["name", "Subject Name"],
      ["code", "Subject Code"],
      ["department", "Department", "departments"],
      ["course", "Course", "courses"],
      ["semester", "Semester", "semesters"],
      ["duration", "Duration (minutes)", "number"],
    ],
  },
  classrooms: {
    title: "Classrooms",
    fields: [
      ["roomNo", "Room No"],
      ["building", "Building"],
      ["capacity", "Capacity", "number"],
      ["rows", "Rows", "number"],
      ["columns", "Columns", "number"],
    ],
  },
  faculty: {
    title: "Faculty",
    fields: [
      ["name", "Faculty Name"],
      ["email", "Email", "email"],
      ["department", "Department", "departments"],
      ["designation", "Designation"],
    ],
  },
};

const relationTypes = new Set(["departments", "courses", "semesters"]);

function optionLabel(type, item) {
  if (type === "semesters")
    return `Sem ${item.number} - ${item.course?.code || ""}`;
  return item.name || item.roomNo || item.code || "Record";
}

function displayValue(type, value) {
  if (type === "semesters") return value?.number ? `Sem ${value.number}` : "";
  if (type === "departments" || type === "courses")
    return optionLabel(type, value || {});
  return String(value ?? "");
}

export default function MasterData({ resource }) {
  const config = configs[resource];
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [lookups, setLookups] = useState({});
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const response = await api.get(`/${resource}`);
      setItems(response.data.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load records.");
    }
  };

  useEffect(() => {
    setForm({});
    setEditingId(null);
    load();

    const dependencies = [
      ...new Set(
        config.fields
          .map((field) => field[2])
          .filter((type) => relationTypes.has(type)),
      ),
    ];

    Promise.all(
      dependencies.map(async (dependency) => {
        const response = await api.get(`/${dependency}`);
        return [dependency, response.data.data.items || []];
      }),
    ).then((entries) => setLookups(Object.fromEntries(entries)));
  }, [resource]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      if (editingId) await api.patch(`/${resource}/${editingId}`, form);
      else await api.post(`/${resource}`, form);
      setForm({});
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed.");
    }
  };

  const beginEdit = (item) => {
    const next = {};
    config.fields.forEach(([key, , type]) => {
      const value = item[key];
      if (relationTypes.has(type)) next[key] = value?._id || value || "";
      else next[key] = value ?? "";
    });
    setForm(next);
    setEditingId(item._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.delete(`/${resource}/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <>
      <PageTitle
        title={config.title}
        description="Master data used by timetable and seating generation."
      />
      <Alert>{error}</Alert>

      {user?.role === "admin" && (
        <form
          onSubmit={submit}
          className={`${panel} mb-4 grid gap-3 md:grid-cols-3`}
        >
          {config.fields.map(([key, name, type]) => (
            <label key={key} className="text-sm">
              {name}
              {lookups[type] ? (
                <select
                  className={input}
                  required
                  value={form[key] || ""}
                  onChange={(event) =>
                    setForm({ ...form, [key]: event.target.value })
                  }
                >
                  <option value="">Select</option>
                  {lookups[type].map((item) => (
                    <option key={item._id} value={item._id}>
                      {optionLabel(type, item)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={input}
                  required={key !== "email"}
                  type={
                    type === "number"
                      ? "number"
                      : type === "email"
                        ? "email"
                        : "text"
                  }
                  value={form[key] ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      [key]:
                        type === "number"
                          ? Number(event.target.value)
                          : event.target.value,
                    })
                  }
                />
              )}
            </label>
          ))}

          <div className="flex items-end gap-2">
            <button className={primary}>{editingId ? "Update" : "Add"}</button>
            {editingId && (
              <button
                type="button"
                className={danger}
                onClick={() => {
                  setEditingId(null);
                  setForm({});
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className={`${panel} overflow-x-auto`}>
        {items.length ? (
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-[#cff4fc]">
              <tr>
                {config.fields.map((field) => (
                  <th key={field[0]} className="px-3 py-2 text-left">
                    {field[1]}
                  </th>
                ))}
                {user?.role === "admin" && (
                  <th className="px-3 py-2 text-left">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b">
                  {config.fields.map(([key, , type]) => (
                    <td key={key} className="px-3 py-2">
                      {displayValue(type, item[key])}
                    </td>
                  ))}
                  {user?.role === "admin" && (
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          className={primary}
                          onClick={() => beginEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className={danger}
                          onClick={() => remove(item._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty />
        )}
      </div>
    </>
  );
}
