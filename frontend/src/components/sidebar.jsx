import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div>
      <h2>Timetable Generator</h2>

      <ul>
        <li>
          <Link to="/">Dashboard</Link>
        </li>
        <li>
          <Link to="/subjects">Subjects</Link>
        </li>
        <li>
          <Link to="/students">Students</Link>
        </li>
        <li>
          <Link to="/faculty">Faculties</Link>
        </li>
        <li>
          <Link to="/exam-settings">Exam Settings</Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
