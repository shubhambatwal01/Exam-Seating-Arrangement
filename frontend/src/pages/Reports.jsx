import { useEffect, useState } from "react";
import api from "../services/axios";
import { PageTitle, input, panel, primary } from "../components/UI";
export default function Reports() {
  const [sessions, setSessions] = useState([]),
    [students, setStudents] = useState([]),
    [sessionId, setSessionId] = useState(""),
    [studentId, setStudentId] = useState("");
  useEffect(() => {
    Promise.all([api.get("/exam-sessions"), api.get("/students")]).then(
      ([a, b]) => {
        setSessions(a.data.data);
        setStudents(b.data.data.items || []);
      },
    );
  }, []);
  const download = async (path, name, open = false) => {
    const r = await api.get(path, { responseType: "blob" }),
      u = URL.createObjectURL(r.data);
    if (open) window.open(u, "_blank");
    else {
      const a = document.createElement("a");
      a.href = u;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    }
  };
  return (
    <>
      <PageTitle
        title="Reports & Export"
        description="Download Excel listings or open printable PDF reports."
      />
      <div className={`${panel} space-y-5`}>
        <div>
          <h2 className="font-semibold">Student Listing</h2>
          <button
            className={`${primary} mt-2`}
            onClick={() => download("/reports/students.xlsx", "students.xlsx")}
          >
            Download Students Excel
          </button>
        </div>
        <div className="border-t pt-4">
          <h2 className="font-semibold">Exam Session Reports</h2>
          <select
            className={`${input} max-w-lg`}
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          >
            <option value="">Select exam session</option>
            {sessions.map((x) => (
              <option key={x._id} value={x._id}>
                {x.name} - {x.academicYear}
              </option>
            ))}
          </select>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              disabled={!sessionId}
              className={primary}
              onClick={() =>
                download(
                  `/reports/timetable/${sessionId}.pdf`,
                  "timetable.pdf",
                  true,
                )
              }
            >
              Timetable PDF
            </button>
            <button
              disabled={!sessionId}
              className={primary}
              onClick={() =>
                download(
                  `/reports/timetable/${sessionId}.xlsx`,
                  "timetable.xlsx",
                )
              }
            >
              Timetable Excel
            </button>
            <button
              disabled={!sessionId}
              className={primary}
              onClick={() =>
                download(`/reports/seating/${sessionId}.xlsx`, "seating.xlsx")
              }
            >
              Seating Excel
            </button>
          </div>
        </div>
        <div className="border-t pt-4">
          <h2 className="font-semibold">Hall Ticket</h2>
          <select
            className={`${input} max-w-lg`}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">Select student</option>
            {students.map((x) => (
              <option key={x._id} value={x._id}>
                {x.rollNo} - {x.name}
              </option>
            ))}
          </select>
          <button
            disabled={!sessionId || !studentId}
            className={`${primary} mt-2 block`}
            onClick={() =>
              download(
                `/reports/hall-ticket/${studentId}.pdf?examSessionId=${sessionId}`,
                "hall-ticket.pdf",
                true,
              )
            }
          >
            Open Hall Ticket PDF
          </button>
        </div>
      </div>
    </>
  );
}
