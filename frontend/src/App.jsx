import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import NavSidebar from "./components/NavSidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MasterData from "./pages/MasterData";
import Students from "./pages/Students";
import ExamSessions from "./pages/ExamSessions";
import Timetable from "./pages/Timetable";
import Seating from "./pages/Seating";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <NavSidebar />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route
            path="departments"
            element={<MasterData resource="departments" />}
          />
          <Route path="courses" element={<MasterData resource="courses" />} />
          <Route
            path="semesters"
            element={<MasterData resource="semesters" />}
          />
          <Route path="subjects" element={<MasterData resource="subjects" />} />
          <Route
            path="classrooms"
            element={<MasterData resource="classrooms" />}
          />
          <Route path="faculty" element={<MasterData resource="faculty" />} />
          <Route path="exam-sessions" element={<ExamSessions />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="seating" element={<Seating />} />
          <Route path="reports" element={<Reports />} />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
