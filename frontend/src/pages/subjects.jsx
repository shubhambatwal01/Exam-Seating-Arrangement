import { useState, useEffect } from "react";
import {
  getSubjects,
  createSubject,
  deleteSubject,
} from "../services/subjectService";

function Subjects() {
  const [subjects, setSubjects] = useState([]);

  const [form, setForm] = useState({
    subjectCode: "",
    subjectName: "",
    semester: "",
    difficulty: "",
  });

  const loadSubjects = async () => {
    const res = await getSubjects();
    setSubjects(res.data);
    console.log(res.data);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await createSubject(form);
    loadSubjects();
    setForm({
      subjectCode: "",
      subjectName: "",
      semester: "",
      difficulty: "",
    });
  };

  return (
    <div>
      <h1>Subjects</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Subject Code"
          onChange={(e) =>
            setForm({
              ...form,
              subjectCode: e.target.value,
            })
          }
        />

        <input
          placeholder="Subject Name"
          onChange={(e) =>
            setForm({
              ...form,
              subjectName: e.target.value,
            })
          }
        />
        <button>Add Subject</button>
      </form>

      {subjects.map((sub) => (
        <div key={sub._id}>
          {sub.subjectCode} - {sub.subjectName}
          <button onClick={() => deleteSubject(sub._id).then(loadSubjects)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default Subjects;
