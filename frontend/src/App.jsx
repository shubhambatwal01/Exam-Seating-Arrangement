import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Subjects from "./pages/Subjects";
import Students from "./pages/students";
import Faculty from "./pages/Faculty";
import ExamSettings from "./pages/examSettings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/students" element={<Students />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/exam-settings" element={<ExamSettings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
