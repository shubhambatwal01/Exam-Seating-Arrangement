import axios from "axios";

const API = "http://localhost:1101/api/faculty";

export const getFaculties = () => axios.get(API);

export const createFaculty = (data) => axios.post(API, data);

export const deleteFaculty = (id) => axios.delete(`${API}/${id}`);