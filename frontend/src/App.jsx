import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/sidebar";
import Dashboard from "./pages/dashboard";
import Subjects from "./pages/subjects";
import Students from "./pages/students";
import Faculty from "./pages/Faculty";
import ExamSettings from "./pages/examSettings";
import GenerateTimetable from "./pages/GenerateTimetable";
import Timetable from "./pages/Timetable";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <BrowserRouter>
        <div className="mx-auto flex min-h-screen max-w-1400px gap-4 px-4 py-6 lg:px-8">
          <aside className="hidden w-72 shrink-0 rounded-3xl bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl lg:block">
            <Sidebar />
          </aside>

          <main className="flex-1 rounded-3xl bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/students" element={<Students />} />
              <Route path="/faculty" element={<Faculty />} />
              <Route path="/exam-settings" element={<ExamSettings />} />
              <Route
                path="/generate-timetable"
                element={<GenerateTimetable />}
              />
              <Route path="/timetable" element={<Timetable />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
