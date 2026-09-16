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
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { token, user } = response.data.data;

    localStorage.setItem("token", token);

    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);

    return user;
  }
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };
  return (
    <C.Provider value={useMemo(() => ({ user, login, logout }), [user])}>
      {children}
    </C.Provider>
  );
}
export const useAuth = () => useContext(C);
