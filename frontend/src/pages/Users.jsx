import { useEffect, useState } from "react";
import api from "../services/axios";
import { Alert, PageTitle, input, panel, primary } from "../components/UI";

export default function Users() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [error, setError] = useState("");

  const load = async () => {
    const response = await api.get("/users");
    setItems(response.data.data);
  };

  useEffect(() => {
    load().catch((err) =>
      setError(err.response?.data?.message || "Unable to load users."),
    );
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/users", form);
      setForm({ name: "", email: "", password: "", role: "staff" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create user.");
    }
  };

  const patch = async (id, changes) => {
    try {
      await api.patch(`/users/${id}`, changes);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update user.");
    }
  };

  return (
    <>
      <PageTitle
        title="User Management"
        description="Create staff accounts and assign access roles."
      />
      <Alert>{error}</Alert>

      <form
        onSubmit={submit}
        className={`${panel} mb-4 grid gap-3 md:grid-cols-4`}
      >
        <label className="text-sm">
          Name
          <input
            className={input}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label className="text-sm">
          Email
          <input
            type="email"
            className={input}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label className="text-sm">
          Password
          <input
            type="password"
            autoComplete="new-password"
            minLength="8"
            className={input}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </label>
        <label className="text-sm">
          Role
          <select
            className={input}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button className={primary}>Create User</button>
      </form>

      <div className={`${panel} overflow-x-auto`}>
        <table className="w-full min-w-190 text-sm">
          <thead className="bg-[#cff4fc]">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-b">
                <td className="p-2">{item.name}</td>
                <td className="p-2">{item.email}</td>
                <td className="p-2 text-center capitalize">{item.role}</td>
                <td className="p-2 text-center">
                  {item.active ? "Active" : "Disabled"}
                </td>
                <td className="p-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      className={primary}
                      onClick={() =>
                        patch(item._id, {
                          role: item.role === "admin" ? "staff" : "admin",
                        })
                      }
                    >
                      Make {item.role === "admin" ? "Staff" : "Admin"}
                    </button>
                    <button
                      className={primary}
                      onClick={() => patch(item._id, { active: !item.active })}
                    >
                      {item.active ? "Disable" : "Enable"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
