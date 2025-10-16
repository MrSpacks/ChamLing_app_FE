import React from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    console.log("Register:", Object.fromEntries(formData));
    navigate("/"); // после регистрации — возвращаемся на welcome
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input name="username" placeholder="Username" required />
        </div>
        <div>
          <input name="email" type="email" placeholder="Email" required />
        </div>
        <div>
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
      <button onClick={() => navigate("/")}>Back</button>
    </div>
  );
}
