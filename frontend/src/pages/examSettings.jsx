import { useState } from "react";

function ExamSettings() {
  const [settings, setSettings] = useState({
    examType: "",
    startDate: "",
    endDate: "",
    sessionsPerDay: 2,
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(settings);
  };

  return (
    <div>
      <h1>Exam Settings</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Exam Type"
          onChange={(e) =>
            setSettings({
              ...settings,
              examType: e.target.value,
            })
          }
        />

        <input
          type="date"
          onChange={(e) =>
            setSettings({
              ...settings,
              startDate: e.target.value,
            })
          }
        />

        <input
          type="date"
          onChange={(e) =>
            setSettings({
              ...settings,
              endDate: e.target.value,
            })
          }
        />

        <button>Save</button>
      </form>
    </div>
  );
}

export default ExamSettings;
