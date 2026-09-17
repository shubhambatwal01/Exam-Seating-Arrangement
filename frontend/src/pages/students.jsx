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

export default function Students() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [file, setFile] = useState(null);
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [validation, setValidation] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const response = await api.get("/students", { params: { q: query } });
    setItems(response.data.data.items || []);
  };

  useEffect(() => {
    load().catch((err) =>
      setError(err.response?.data?.message || "Unable to load students."),
    );
  }, []);

  const buildFormData = () => {
    const data = new FormData();
    data.append("file", file);
    data.append("academicYear", academicYear);
    return data;
  };

  const validateExcel = async () => {
    if (!file) {
      setError("Choose an .xlsx file first.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await api.post(
        "/students/import/validate",
        buildFormData(),
      );
      setValidation(response.data.data);
      setMessage(response.data.message);
    } catch (err) {
      setValidation(null);
      setError(err.response?.data?.message || "Excel validation failed.");
    } finally {
      setBusy(false);
    }
  };

  const commitImport = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await api.post(
        "/students/import/commit",
        buildFormData(),
      );
      setMessage(
        `${response.data.message} ${response.data.data.studentsInserted} student(s), ${response.data.data.backlogRegistrationsCreated} backlog registration(s).`,
      );
      setValidation(null);
      setFile(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Excel import failed.");
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = async () => {
    const response = await api.get("/students/import/template", {
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student-import-template.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageTitle
        title="Students"
        description="Import fresh and backlog exam appearances from Excel. Validation never writes to MongoDB."
      />
      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>

      {user?.role === "admin" && (
        <div className={`${panel} mb-4`}>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              Academic Year
              <input
                className={input}
                value={academicYear}
                onChange={(event) => setAcademicYear(event.target.value)}
              />
            </label>
            <label className="text-sm">
              Excel File
              <input
                className={`${input} py-1`}
                type="file"
                accept=".xlsx"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                  setValidation(null);
                }}
              />
            </label>
            <button
              className={primary}
              type="button"
              onClick={validateExcel}
              disabled={busy}
            >
              {busy ? "Working..." : "Validate Excel"}
            </button>
            <button
              className={primary}
              type="button"
              onClick={downloadTemplate}
            >
              Download Template
            </button>
            {validation && validation.invalidCount === 0 && (
              <button
                className="rounded-md border border-green-600 px-3 py-[6px] text-green-700 hover:bg-green-600 hover:text-white disabled:opacity-50"
                type="button"
                disabled={busy}
                onClick={commitImport}
              >
                Commit Import
              </button>
            )}
          </div>

          {validation && (
            <div className="mt-4 text-sm">
              <p>
                <b>Rows:</b> {validation.rowCount} &nbsp; <b>Valid:</b>{" "}
                {validation.validCount}
                &nbsp; <b>Invalid:</b> {validation.invalidCount}
              </p>

              {validation.errors?.map((item) => (
                <div
                  key={item.row}
                  className="mt-2 rounded bg-red-50 p-2 text-red-700"
                >
                  Row {item.row} ({item.rollNo || "no roll no"}):{" "}
                  {item.errors.join(" ")}
                </div>
              ))}

              {validation.preview?.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <h3 className="mb-2 font-semibold">Validated Preview</h3>
                  <table className="w-full min-w-212.5 border-collapse text-xs">
                    <thead className="bg-[#cff4fc]">
                      <tr>
                        <th className="p-2 text-left">Row</th>
                        <th className="p-2 text-left">Roll No</th>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Course</th>
                        <th className="p-2">Sem</th>
                        <th className="p-2 text-left">Fresh Subjects</th>
                        <th className="p-2 text-left">Backlog Subjects</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.preview.map((row) => (
                        <tr key={row.rowNumber} className="border-b">
                          <td className="p-2">{row.rowNumber}</td>
                          <td className="p-2">{row.rollNo}</td>
                          <td className="p-2">{row.name}</td>
                          <td className="p-2">{row.courseCode}</td>
                          <td className="p-2 text-center">{row.semester}</td>
                          <td className="p-2">
                            {row.freshSubjectCodes?.join(", ") || "—"}
                          </td>
                          <td className="p-2">
                            {row.backlogSubjectCodes?.join(", ") || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={`${panel} overflow-x-auto`}>
        <div className="mb-3 flex max-w-xl gap-2">
          <input
            className={input}
            placeholder="Search roll no or name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && load()}
          />
          <button className={primary} onClick={load}>
            Search
          </button>
        </div>

        {items.length ? (
          <table className="w-full min-w-212.5 text-sm">
            <thead className="bg-[#cff4fc]">
              <tr>
                <th className="p-2 text-left">Roll No</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Course</th>
                <th className="p-2">Semester</th>
                <th className="p-2">Type</th>
                <th className="p-2 text-left">Current Subjects</th>
              </tr>
            </thead>
            <tbody>
              {items.map((student) => (
                <tr key={student._id} className="border-b">
                  <td className="p-2 font-medium">{student.rollNo}</td>
                  <td className="p-2">{student.name}</td>
                  <td className="p-2">{student.course?.code}</td>
                  <td className="p-2 text-center">
                    {student.semester?.number}
                  </td>
                  <td className="p-2 text-center capitalize">{student.type}</td>
                  <td className="p-2">
                    {student.subjects
                      ?.map((subject) => subject.code)
                      .join(", ") || "—"}
                  </td>
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
