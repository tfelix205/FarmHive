import { useState } from "react";
import api from "../services/api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      window.location.href = "/admin";
    } catch {
      alert("Invalid login");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="border p-6 w-80">
        <h2 className="text-xl font-bold mb-4">Admin Login</h2>
        <input
          placeholder="Email"
          className="border p-2 w-full mb-2"
          onChange={e => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          className="border p-2 w-full mb-4"
          onChange={e => setPassword(e.target.value)}
        />
        <button
          onClick={login}
          className="bg-green-600 text-white w-full py-2"
        >
          Login
        </button>
      </div>
    </div>
  );
}
