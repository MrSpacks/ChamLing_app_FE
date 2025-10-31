import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../Theme";
import "./Settings.css";

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [language, setLanguage] = useState(i18n.language);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/");
  };

  return (
    <div className="content_container">
      <h1 className="page_title">{t("settings.title") || "Настройки"}</h1>

      <div className="settings_sections">
        {/* Язык */}
        <section className="settings_section">
          <h2 className="section_title">
            {t("settings.language") || "Язык приложения"}
          </h2>
          <div className="settings_options">
            <button
              className={`option_button ${language === "ru" ? "active" : ""}`}
              onClick={() => handleLanguageChange("ru")}
            >
              Русский
            </button>
            <button
              className={`option_button ${language === "en" ? "active" : ""}`}
              onClick={() => handleLanguageChange("en")}
            >
              English
            </button>
          </div>
        </section>

        {/* Тема */}
        <section className="settings_section">
          <h2 className="section_title">
            {t("settings.theme") || "Тема оформления"}
          </h2>
          <div className="settings_options">
            <button
              className={`option_button ${theme === "light-theme" ? "active" : ""}`}
              onClick={() => toggleTheme()}
            >
              {theme === "light-theme"
                ? t("settings.light_theme") || "Светлая тема"
                : t("settings.dark_theme") || "Тёмная тема"}
            </button>
          </div>
        </section>

        {/* Выход */}
        <section className="settings_section">
          <h2 className="section_title">
            {t("settings.account") || "Аккаунт"}
          </h2>
          <button className="logout_button" onClick={handleLogout}>
            {t("settings.logout") || "Выйти"}
          </button>
        </section>
      </div>
    </div>
  );
};

export default Settings;
