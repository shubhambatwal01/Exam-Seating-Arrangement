import axios from "axios";

const API = "/api/timetable";

export const generateTimetable = async (data) => {
  try {
    const response = await axios.post(`${API}/generate`, { data });
    return response.data;
  } catch (error) {
    console.error("Error generating timetable:", error);
    throw error;
  }
};

export const getTimetable = async () => {
  try {
    const response = await axios.get(API);
    return response.data;
  } catch (error) {
    console.error("Error fetching timetable:", error);
    throw error;
  }
};
