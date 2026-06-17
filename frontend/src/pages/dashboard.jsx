import Sidebar from "../components/Sidebar";

function Dashboard() {
  return (
    <div>
      <Sidebar />

      <h1>Admin Dashboard</h1>

      <div>
        <h3>Total Students</h3>
        <p>0</p>
      </div>

      <div>
        <h3>Total Subjects</h3>
        <p>0</p>
      </div>
    </div>
  );
}

export default Dashboard;
