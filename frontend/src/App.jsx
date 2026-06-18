import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Subjects from "./pages/Subjects";
import Students from "./pages/students";
import Faculty from "./pages/Faculty";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/students" element={<Students />} />
        <Route path="/faculty" element={<Faculty />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
