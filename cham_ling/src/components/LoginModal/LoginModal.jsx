import React, { useState } from "react";
import { loginUser } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import "./LoginModal.css";
import { useTranslation } from "react-i18next";
import Button from "../Buttons/Button";
import { FiMail } from "react-icons/fi";
import { FaLock } from "react-icons/fa";

export default function LoginModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginUser(email, password);
      // например { access: "...", refresh: "..." }
      localStorage.setItem("token", data.access);
      alert("Login successful!");
      onClose();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <button className="closeButton" onClick={onClose}>
          &times;
        </button>

        <h2>{t("login")}</h2>
        <form onSubmit={handleSubmit}>
          <div className="input_container">
            <div className="register_input input_with_icon">
              <FiMail className="input_icon" />
              <input
                type="email"
                placeholder={t("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="register_input input_with_icon">
              <FaLock className="input_icon" />
              <input
                type="password"
                placeholder={t("password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}
          <div className="button_group_modal">
            <Button
              type="submit"
              disabled={loading}
              text={loading ? t("loading") : t("login")}
            />

            <Button type="button" onClick={onClose} text={t("cancel")} />
          </div>
        </form>
        <p>
          {t("no_account")}{" "}
          <span className="navigate_btn" onClick={() => navigate("/register")}>
            {" "}
            {t("register")}
          </span>
        </p>
      </div>
    </div>
  );
}
