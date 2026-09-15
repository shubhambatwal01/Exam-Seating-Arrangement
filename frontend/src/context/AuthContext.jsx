import { createContext, useContext, useMemo, useState } from "react";
import api from "../services/axios";
const C = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("esa_user"));
    } catch {
      return null;
    }
  });
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("esa_token", data.data.token);
    localStorage.setItem("esa_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
  };
  const logout = () => {
    localStorage.removeItem("esa_token");
    localStorage.removeItem("esa_user");
    setUser(null);
  };
  return (
    <C.Provider value={useMemo(() => ({ user, login, logout }), [user])}>
      {children}
    </C.Provider>
  );
}
export const useAuth = () => useContext(C);
