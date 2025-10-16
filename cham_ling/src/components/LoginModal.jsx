import React from "react";

export default function LoginModal({ onClose }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");
    console.log("Login:", username, password);
    onClose(); // закрываем модалку после логина
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ background: "white", padding: 20, borderRadius: 8 }}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <input name="username" placeholder="Username" required />
          </div>
          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
            />
          </div>
          <button type="submit">Login</button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
