import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../api/auth";
import { useTranslation } from "react-i18next";
import PageLayout from "../../components/PageLayout";
import Button from "../../components/Buttons/Button";
import NotificationSetup from "../../components/NotificationSetup/NotificationSetup";
import { FaAngleLeft } from "react-icons/fa";
import "./RegisterPage.css";
import { FiMail, FiUser } from "react-icons/fi";
import { FaLock } from "react-icons/fa";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showNotificationSetup, setShowNotificationSetup] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case "username":
        if (!value.trim()) {
          newErrors.username = t("Register.errors.username_required") || "Имя пользователя обязательно";
        } else if (value.trim().length < 3) {
          newErrors.username = t("Register.errors.username_min_length") || "Имя пользователя должно быть не менее 3 символов";
        } else {
          delete newErrors.username;
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          newErrors.email = t("Register.errors.email_required") || "Email обязателен";
        } else if (!emailRegex.test(value)) {
          newErrors.email = t("Register.errors.email_invalid") || "Некорректный email";
        } else {
          delete newErrors.email;
        }
        break;
      case "password":
        if (!value) {
          newErrors.password = t("Register.errors.password_required") || "Пароль обязателен";
        } else if (value.length < 8) {
          newErrors.password = t("Register.errors.password_min_length") || "Пароль должен быть не менее 8 символов";
        } else {
          delete newErrors.password;
        }
        // Проверка совпадения паролей
        if (confirmPassword && value !== confirmPassword) {
          newErrors.confirmPassword = t("passwords_mismatch");
        } else if (confirmPassword && value === confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;
      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword = t("Register.errors.confirm_password_required") || "Подтверждение пароля обязательно";
        } else if (value !== password) {
          newErrors.confirmPassword = t("passwords_mismatch");
        } else {
          delete newErrors.confirmPassword;
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
      case "username":
        setUsername(value);
        if (touched.username) validateField("username", value);
        break;
      case "email":
        setEmail(value);
        if (touched.email) validateField("email", value);
        break;
      case "password":
        setPassword(value);
        if (touched.password) validateField("password", value);
        if (touched.confirmPassword && confirmPassword) {
          validateField("confirmPassword", confirmPassword);
        }
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        if (touched.confirmPassword) validateField("confirmPassword", value);
        break;
      default:
        break;
    }
    
    if (error) setError(null);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!username.trim()) {
      newErrors.username = t("Register.errors.username_required") || "Имя пользователя обязательно";
    } else if (username.trim().length < 3) {
      newErrors.username = t("Register.errors.username_min_length") || "Имя пользователя должно быть не менее 3 символов";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = t("Register.errors.email_required") || "Email обязателен";
    } else if (!emailRegex.test(email)) {
      newErrors.email = t("Register.errors.email_invalid") || "Некорректный email";
    }
    
    if (!password) {
      newErrors.password = t("Register.errors.password_required") || "Пароль обязателен";
    } else if (password.length < 8) {
      newErrors.password = t("Register.errors.password_min_length") || "Пароль должен быть не менее 8 символов";
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = t("Register.errors.confirm_password_required") || "Подтверждение пароля обязательно";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t("passwords_mismatch");
    }
    
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNotificationComplete = () => {
    setShowNotificationSetup(false);
    alert(t("registration_successful") || "Регистрация прошла успешно!");
    navigate("/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser(username, email, password);
      localStorage.setItem("accessToken", response.access);
      localStorage.setItem("refreshToken", response.refresh);
      setRegistrationSuccess(true);
      setShowNotificationSetup(true);
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
        {showNotificationSetup ? (
          <NotificationSetup onComplete={handleNotificationComplete} />
        ) : (
          <div className="register_content">
            <h1 className="register_title">{t("register")}</h1>
            <form onSubmit={handleSubmit} className="input_container">
            <div className="register_input">
              {/* <label htmlFor="email">{t("email")}</label> */}
              <div className="register_input input_with_icon">
                <FiUser className="input_icon" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder={t("username")}
                  value={username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  onBlur={handleBlur}
                  className={errors.username ? "input_error" : touched.username && !errors.username ? "input_valid" : ""}
                  disabled={loading}
                  required
                />
                {errors.username && (
                  <span className="error_text">{errors.username}</span>
                )}
              </div>
            </div>

            <div className="register_input">
              {/* <label htmlFor="email">{t("email")}</label> */}
              <div className="register_input input_with_icon">
                <FiMail className="input_icon" />
                <input
                  type="email"
                  id="email"
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
            </div>
            <div className="register_input">
              {/* <label htmlFor="password">{t("password")}</label> */}
              <div className="register_input input_with_icon">
                <FaLock className="input_icon" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder={t("password")}
                  value={password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={handleBlur}
                  className={errors.password ? "input_error" : touched.password && !errors.password && password.length >= 8 ? "input_valid" : ""}
                  disabled={loading}
                  required
                />
                {touched.password && password && (
                  <small className="password_strength">
                    {password.length < 8
                      ? t("Register.password_weak") || "Слабый пароль (минимум 8 символов)"
                      : t("Register.password_strong") || "Надёжный пароль"}
                  </small>
                )}
                {errors.password && (
                  <span className="error_text">{errors.password}</span>
                )}
              </div>
            </div>
            <div className="register_input">
              {/* <label htmlFor="confirmPassword">{t("repeat_password")}</label> */}
              <div className="register_input input_with_icon">
                <FaLock className="input_icon" />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirm_password"
                  placeholder={t("repeat_password")}
                  value={confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  onBlur={handleBlur}
                  className={errors.confirmPassword ? "input_error" : touched.confirmPassword && !errors.confirmPassword && confirmPassword === password ? "input_valid" : ""}
                  disabled={loading}
                  required
                />
                {errors.confirmPassword && (
                  <span className="error_text">{errors.confirmPassword}</span>
                )}
              </div>
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
        )}
        {!showNotificationSetup && (
          <button className="back_button" onClick={() => navigate("/")}>
            <FaAngleLeft />
          </button>
        )}
      </div>
    </PageLayout>
  );
}
