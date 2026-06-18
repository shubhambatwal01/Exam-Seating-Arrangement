import { useEffect, useState } from "react";

import {
  getFaculties,
  createFaculty,
  deleteFaculty,
} from "../services/facultyService";

function Faculty() {
  const [faculties, setFaculties] = useState([]);

  const [form, setForm] = useState({
    facultyName: "",
    subject: "",
  });

  const loadFaculties = async () => {
    const res = await getFaculties();

    setFaculties(res.data);
  };

  useEffect(() => {
    loadFaculties();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await createFaculty(form);

    setForm({
      facultyName: "",
      subject: "",
    });

    loadFaculties();
  };

  const handleDelete = async (id) => {
    await deleteFaculty(id);

    loadFaculties();
  };

  return (
    <>
      <h1>Faculty Management</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Faculty Name"
          value={form.facultyName}
          onChange={(e) =>
            setForm({
              ...form,
              facultyName: e.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Subject"
          value={form.subject}
          onChange={(e) =>
            setForm({
              ...form,
              subject: e.target.value,
            })
          }
        />

        <button type="submit">Add Faculty</button>
      </form>

      <hr />

      {faculties.map((faculty) => (
        <div key={faculty._id}>
          <h3>{faculty.facultyName}</h3>

          <p>{faculty.subject}</p>

          <button onClick={() => handleDelete(faculty._id)}>Delete</button>
        </div>
      ))}
    </>
  );
}

export default Faculty;
