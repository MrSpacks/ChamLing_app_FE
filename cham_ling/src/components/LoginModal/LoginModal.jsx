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
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          newErrors.email = t("Login.errors.email_required") || "Email обязателен";
        } else if (!emailRegex.test(value)) {
          newErrors.email = t("Login.errors.email_invalid") || "Некорректный email";
        } else {
          delete newErrors.email;
        }
        break;
      case "password":
        if (!value) {
          newErrors.password = t("Login.errors.password_required") || "Пароль обязателен";
        } else {
          delete newErrors.password;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleChange = (name, value) => {
    switch (name) {
      case "email":
        setEmail(value);
        if (touched.email) validateField("email", value);
        break;
      case "password":
        setPassword(value);
        if (touched.password) validateField("password", value);
        break;
      default:
        break;
    }
    
    if (error) setError(null);
  };

  const validate = () => {
    const newErrors = {};
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = t("Login.errors.email_required") || "Email обязателен";
    } else if (!emailRegex.test(email)) {
      newErrors.email = t("Login.errors.email_invalid") || "Некорректный email";
    }
    
    if (!password) {
      newErrors.password = t("Login.errors.password_required") || "Пароль обязателен";
    }
    
    setTouched({
      email: true,
      password: true,
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(email, password);
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
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
                name="email"
                placeholder={t("email")}
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={handleBlur}
                className={errors.email ? "input_error" : touched.email && !errors.email ? "input_valid" : ""}
                disabled={loading}
                required
              />
              {errors.email && (
                <span className="error_text">{errors.email}</span>
              )}
            </div>
            <div className="register_input input_with_icon">
              <FaLock className="input_icon" />
              <input
                type="password"
                name="password"
                placeholder={t("password")}
                value={password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={handleBlur}
                className={errors.password ? "input_error" : touched.password && !errors.password ? "input_valid" : ""}
                disabled={loading}
                required
              />
              {errors.password && (
                <span className="error_text">{errors.password}</span>
              )}
            </div>
          </div>

          {error && <p className="error_message_submit">{error}</p>}
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
