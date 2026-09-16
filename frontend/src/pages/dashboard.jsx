import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../services/axios";
import { PageTitle, panel } from "../components/UI";
export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setData(r.data.data))
      .catch(() => setData({ stats: {} }));
  }, []);
  const s = data?.stats || {};
  const cards = [
    ["Total Students", s.totalStudents],
    ["Fresh Students", s.freshStudents],
    ["Backlog Students", s.backlogStudents],
    ["Upcoming Exams", s.upcomingExams],
    ["Classrooms Utilized", s.classroomsUtilized],
    ["Active Sessions", s.activeExamSessions],
  ];
  return (
    <>
      <PageTitle
        title="Dashboard"
        description="Live overview of examination data, capacity and upcoming activity."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([k, v]) => (
          <div className={panel} key={k}>
            <p className="text-sm text-slate-500">{k}</p>
            <p className="mt-2 text-3xl font-semibold text-[#034568]">
              {v ?? "—"}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className={panel}>
          <h2 className="mb-3 font-semibold">Department-wise Students</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.departmentDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={panel}>
          <h2 className="mb-3 font-semibold">Semester-wise Students</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.semesterDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
