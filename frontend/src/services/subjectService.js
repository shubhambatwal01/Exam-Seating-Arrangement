import axios from "axios";

const API = "/api/subjects";

export const getSubjects = () => axios.get(API);

export const createSubject = (data) => axios.post(API, data);

export const deleteSubject = (id) => axios.delete(`${API}/${id}`);
