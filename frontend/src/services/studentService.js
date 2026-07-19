import axios from "axios";

const API = "/api/students";

export const getStudents = () => axios.get(API);

export const createStudent = (data) => axios.post(API, data);

export const deleteStudent = (id) => axios.delete(`${API}/${id}`);
