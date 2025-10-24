import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../api/auth";
import { useTranslation } from "react-i18next";
import PageLayout from "../../components/PageLayout";
import Button from "../../components/Buttons/Button";
import { FaAngleLeft } from "react-icons/fa";
import "./RegisterPage.css";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError(t("passwords_mismatch"));
      setLoading(false);
      return;
    }

    try {
      const response = await registerUser(email, password);
      localStorage.setItem("accessToken", response.access);
      localStorage.setItem("refreshToken", response.refresh);
      alert(t("registration_successful"));
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.message.includes("Server error")
          ? `${t("server_error")}: ${err.message}`
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="register_container">
        <div className="register_content">
          <h1 className="register_title">{t("register")}</h1>
          <form onSubmit={handleSubmit} className="input_container">
            <div className="register_input">
              <label htmlFor="email">{t("email")}</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder={t("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="register_input">
              <label htmlFor="password">{t("password")}</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder={t("password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="register_input">
              <label htmlFor="confirmPassword">{t("repeat_password")}</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirm_password"
                placeholder={t("repeat_password")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p style={{ color: "red", textAlign: "center" }}>{error}</p>
            )}
            <div className="button_group">
              <Button
                type="submit"
                disabled={loading}
                text={loading ? t("loading") : t("register")}
              />
              <Button onClick={() => navigate("/")} text={t("back")} />
            </div>
          </form>
        </div>
        <button className="back_button" onClick={() => navigate("/")}>
          <FaAngleLeft />
        </button>
      </div>
    </PageLayout>
  );
}
