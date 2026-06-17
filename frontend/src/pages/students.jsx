import { useState, useEffect } from "react";

import {
  getStudents,
  createStudent,
  deleteStudent,
} from "../services/studentService";

function Students() {
  const [students, setStudents] = useState([]);

  const [form, setForm] = useState({
    prn: "",
    name: "",
    email: "",
    semester: "",
    course: "",
  });

  const loadStudents = async () => {
    const res = await getStudents();
    setStudents(res.data);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await createStudent(form);

    loadStudents();
  };

  return (
    <>
      <h1>Students</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Enter PRN Number"
          onChange={(e) =>
            setForm({
              ...form,
              prn: e.target.value,
            })
          }
        />
        <input
          placeholder="Enter Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Enter Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <button>Add Students</button>
      </form>
      {students.map((student) => (
        <div key={student._id}>
          {student.name}
          {student.email}
        </div>
      ))}
    </>
  );
}

export default Students;
