import React, { useState } from "react";
import axios from "axios";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/register", {
        username,
        password,
      });
      setMessage("Kayıt başarılı ✅");
      console.log(res.data);
    } catch (err: any) {
      setMessage("Kayıt başarısız ❌");
      console.error(err.response?.data || err.message);
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
          Register
        </div>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
            Create
          </button>
          <a href="./Login"
          className="w-full pb-6 mt-[24px] text-center"
          style={{ fontSize: "16px" }}
        >
          I have an account
        </a>
        </form>
      {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </div>
  );
}