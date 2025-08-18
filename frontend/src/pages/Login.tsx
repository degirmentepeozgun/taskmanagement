import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Hata mesajı için
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Önce hata mesajını temizle

    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", String(res.data.user.id));
      localStorage.setItem("username", res.data.user.username);
      navigate("/dashboard");
    } catch (err) {
      // Hata varsa mesaj göster
      setError("Username or Password is incorrect");
    }
  };

  return (
    <div
      className="w-full h-screen flex justify-center items-center"
      style={{ backgroundColor: "#f3f4f6" }}
    >
      <div
        className="max-w-[320px] p-[24px] w-full rounded-[6px] shadow-[0_4px_12px_rgba(0,0,0,.15)] bg-white p-6"
      >
        <div
          className="w-full pb-6 mb-[24px] text-center"
          style={{ fontSize: "32px", fontWeight: "600" }}
        >
          Log In
        </div>

        {/* Hata mesajı burada */}
        {error && (
          <div
            className="mb-4 text-red-600 text-center font-semibold"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-[12px] mb-[24px] text-base rounded outline-none border border-gray-300"
            style={{ fontSize: "16px" }}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-[12px] mb-[24px] text-base rounded outline-none border border-gray-300"
            style={{ fontSize: "16px" }}
          />
          <button
            type="submit"
            className="w-full border p-3 rounded bg-blue-600 text-white"
            style={{ fontSize: "20px", textAlign: "center" }}
          >
            Login
          </button>
          <a
            href="./Register"
            className="w-full pb-6 mt-[24px] text-center"
            style={{ fontSize: "16px" }}
          >
            Create New Account
          </a>
        </form>
      </div>
    </div>
  );
}

export default Login;
