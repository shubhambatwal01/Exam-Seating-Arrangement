import axios from "axios";

const API = "http://localhost:3000/api/subjects";

export const getSubject = () => axios.get(API);

export const createSubject = (data) => axios.post(API, data);

export const deleteSubject = (id) => axios.delete(`${API}/${id}`);