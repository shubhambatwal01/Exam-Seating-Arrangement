import { useEffect, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  TicketCheck,
} from "lucide-react";
import api from "../services/axios";
import {
  Alert,
  Empty,
  PageTitle,
  input,
  panel,
  primary,
} from "../components/UI";

export default function Reports() {
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [hallTicket, setHallTicket] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/exam-sessions"), api.get("/students")])
      .then(([sessionResponse, studentResponse]) => {
        setSessions(sessionResponse.data.data);
        setStudents(studentResponse.data.data.items || []);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Unable to load report data."),
      );
  }, []);

  useEffect(() => {
    if (!sessionId || !studentId) {
      setHallTicket(null);
      return;
    }

    let cancelled = false;
    setLoadingTicket(true);
    setError("");

    api
      .get(`/reports/hall-ticket/${studentId}/preview`, {
        params: { examSessionId: sessionId },
      })
      .then((response) => {
        if (!cancelled) setHallTicket(response.data.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setHallTicket(null);
          setError(
            err.response?.data?.message ||
              "Unable to build hall ticket preview.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTicket(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, studentId]);

  const download = async (path, name, open = false) => {
    try {
      setError("");
      const response = await api.get(path, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);

      if (open) {
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return;
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to download report.");
    }
  };

  const selectedSession = sessions.find((item) => item._id === sessionId);

  return (
    <>
      <PageTitle
        title="Reports & Export"
        description="Institutional timetable/seating reports and student hall tickets formatted for examination use."
      />
      <Alert>{error}</Alert>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={`${panel} space-y-5`}>
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={19} className="text-cyan-700" />
              <h2 className="font-semibold">Student Listing</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Export the current student master data as Excel.
            </p>
            <button
              className={`${primary} mt-3`}
              onClick={() =>
                download("/reports/students.xlsx", "students.xlsx")
              }
            >
              <span className="inline-flex items-center gap-2">
                <Download size={15} />
                Download Students Excel
              </span>
            </button>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2">
              <FileText size={19} className="text-cyan-700" />
              <h2 className="font-semibold">Exam Session Reports</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              The timetable export follows the supplied Modern College skeleton.
              Seating Excel/PDF uses the supplied hall-wise seat-list formation.
            </p>

            <select
              className={`${input} max-w-lg`}
              value={sessionId}
              onChange={(event) => {
                setSessionId(event.target.value);
                setHallTicket(null);
              }}
            >
              <option value="">Select exam session</option>
              {sessions.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} - {item.academicYear}
                </option>
              ))}
            </select>

            {selectedSession && (
              <div className="mt-2 rounded-md border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
                <b>{selectedSession.name}</b> • {selectedSession.academicYear}
                <br />
                {String(selectedSession.startDate).slice(0, 10)} to{" "}
                {String(selectedSession.endDate).slice(0, 10)}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                disabled={!sessionId}
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
                  <Printer size={15} /> Timetable PDF
                </span>
              </button>
              <button
                disabled={!sessionId}
                className={primary}
                onClick={() =>
                  download(
                    `/reports/timetable/${sessionId}.xlsx`,
                    "exam-timetable.xlsx",
                  )
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Download size={15} /> Timetable Excel
                </span>
              </button>
              <button
                disabled={!sessionId}
                className={primary}
                onClick={() =>
                  download(`/reports/seating/${sessionId}.xlsx`, "seating.xlsx")
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Download size={15} /> Seating Excel
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className={panel}>
          <div className="flex items-center gap-2">
            <TicketCheck size={20} className="text-cyan-700" />
            <h2 className="font-semibold">Student Hall Ticket</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Select the exam session and student. Fresh and backlog papers are
            combined automatically; room and bench details are taken from the
            generated seating arrangement.
          </p>

          <label className="mt-4 block max-w-lg text-sm">
            Student
            <select
              className={input}
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
            >
              <option value="">Select student</option>
              {students.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.rollNo} - {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              disabled={!sessionId || !studentId || loadingTicket}
              className={primary}
              onClick={() =>
                download(
                  `/reports/hall-ticket/${studentId}.pdf?examSessionId=${sessionId}`,
                  `${hallTicket?.student?.rollNo || "student"}-hall-ticket.pdf`,
                  true,
                )
              }
            >
              <span className="inline-flex items-center gap-2">
                <Printer size={15} /> Open Hall Ticket PDF
              </span>
            </button>
            <button
              disabled={!sessionId || !studentId || loadingTicket}
              className={primary}
              onClick={() =>
                download(
                  `/reports/hall-ticket/${studentId}.pdf?examSessionId=${sessionId}`,
                  `${hallTicket?.student?.rollNo || "student"}-hall-ticket.pdf`,
                )
              }
            >
              <span className="inline-flex items-center gap-2">
                <Download size={15} /> Download PDF
              </span>
            </button>
          </div>

          {loadingTicket && (
            <div className="py-8 text-center text-sm text-slate-500">
              Building hall ticket preview...
            </div>
          )}
        </section>
      </div>

      <section className={`${panel} mt-4`}>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Hall Ticket Preview
            </h2>
            <p className="text-xs text-slate-500">
              This preview shows the same core schedule data used in the
              printable PDF.
            </p>
          </div>
          {hallTicket && (
            <span className="rounded bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800">
              {hallTicket.hallTicketNo}
            </span>
          )}
        </div>

        {hallTicket ? (
          <div className="overflow-hidden rounded-md border border-slate-300">
            <div className="bg-white px-4 py-4 text-center">
              <div className="text-xs font-semibold">
                Progressive Education Society&apos;s
              </div>
              <div className="text-lg font-bold">
                MODERN COLLEGE OF ARTS, SCIENCE & COMMERCE
              </div>
              <div className="text-xs">Ganeshkhind, Pune - 411016.</div>
              <div className="mt-2 text-base font-bold text-cyan-800">
                STUDENT EXAMINATION HALL TICKET
              </div>
            </div>

            <div className="grid border-y border-slate-300 text-sm sm:grid-cols-2">
              <div className="border-b border-slate-300 p-3 sm:border-b-0 sm:border-r">
                <b>Seat / Roll No:</b> {hallTicket.student.rollNo}
                <br />
                <b>Student:</b> {hallTicket.student.name}
                <br />
                <b>Department:</b> {hallTicket.student.department}
              </div>
              <div className="p-3">
                <b>Course:</b> {hallTicket.student.course}
                <br />
                <b>Semester:</b> {hallTicket.student.semesterRoman}
                <br />
                <b>Session:</b> {hallTicket.session.name} (
                {hallTicket.session.academicYear})
              </div>
            </div>

            <div className="overflow-x-auto">
              {hallTicket.papers.length ? (
                <table className="w-full min-w-[900px] border-collapse text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      {[
                        "#",
                        "Date",
                        "Day",
                        "Time",
                        "Sub Code",
                        "Subject",
                        "Type",
                        "Room",
                        "Bench",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="border border-slate-300 px-2 py-2 text-center"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hallTicket.papers.map((paper) => (
                      <tr key={`${paper.isoDate}-${paper.subjectCode}`}>
                        <td className="border border-slate-300 p-2 text-center">
                          {paper.srNo}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          {paper.date}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          {paper.day}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          {paper.time}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-semibold">
                          {paper.subjectCode}
                        </td>
                        <td className="border border-slate-300 p-2">
                          {paper.subjectName}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          <span
                            className={`rounded px-2 py-1 ${
                              paper.appearanceType === "Backlog"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {paper.appearanceType}
                          </span>
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          {paper.roomNo}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          {paper.seatNo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty text="No scheduled papers are available for this student in the selected session." />
              )}
            </div>
          </div>
        ) : (
          <Empty text="Select an exam session and student to preview the hall ticket." />
        )}
      </section>
    </>
  );
}
