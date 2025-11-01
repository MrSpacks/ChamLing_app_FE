import { useState, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../Theme";
import { getUserProfile, updateUserProfile } from "../../api/auth";
import { setupDailyNotifications, disableNotifications, requestNotificationPermission } from "../../utils/notifications";
import { FaBell, FaClock, FaUser, FaSignOutAlt } from "react-icons/fa";
import "./Settings.css";

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [language, setLanguage] = useState(i18n.language);
  
  // Состояние профиля пользователя
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Состояние уведомлений
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationHour, setNotificationHour] = useState(9);
  const [notificationMinute, setNotificationMinute] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);

  // Загрузка профиля пользователя
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
        setNotificationsEnabled(userProfile.notifications_enabled || false);
        setNotificationHour(userProfile.notification_hour || 9);
        setNotificationMinute(userProfile.notification_minute || 0);
      } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
      } finally {
        setLoading(false);
      }
    };

    // Проверка разрешения на уведомления
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission === 'granted');
    }

    loadProfile();
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/");
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      // Включаем уведомления - запрашиваем разрешение
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert(t("settings.notifications_permission_required") || "Для включения уведомлений требуется разрешение браузера.");
        return;
      }
      setNotificationPermission(true);
    }

    const newEnabled = !notificationsEnabled;
    setNotificationsEnabled(newEnabled);
    
    await handleSaveNotifications(newEnabled, notificationHour, notificationMinute);
  };

  const handleSaveNotifications = async (enabled, hour, minute) => {
    setSaving(true);
    try {
      const updatedProfile = await updateUserProfile({
        notifications_enabled: enabled,
        notification_hour: hour,
        notification_minute: minute,
      });
      
      setProfile(updatedProfile);
      
      if (enabled) {
        // Настраиваем ежедневные уведомления
        setupDailyNotifications(hour, minute);
      } else {
        // Отключаем уведомления
        disableNotifications();
      }
      
      alert(t("settings.notifications_saved") || "Настройки уведомлений сохранены!");
    } catch (error) {
      console.error("Ошибка сохранения настроек:", error);
      alert(t("settings.notifications_save_error") || "Ошибка при сохранении настроек: " + error.message);
      // Откатываем изменения
      setNotificationsEnabled(!enabled);
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async () => {
    if (notificationsEnabled) {
      await handleSaveNotifications(notificationsEnabled, notificationHour, notificationMinute);
    }
  };

  if (loading) {
    return (
      <div className="content_container">
        <h1 className="page_title">{t("settings.title") || "Настройки"}</h1>
        <div className="loading_container">
          <p>{t("settings.loading") || "Загрузка..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content_container">
      <h1 className="page_title">{t("settings.title") || "Настройки"}</h1>

      <div className="settings_sections">
        {/* Управление аккаунтом */}
        <section className="settings_section">
          <h2 className="section_title">
            <FaUser className="section_icon" />
            {t("settings.account") || "Управление аккаунтом"}
          </h2>
          {profile && (
            <div className="account_info">
              <div className="account_field">
                <span className="account_label">{t("settings.username") || "Имя пользователя"}:</span>
                <span className="account_value">{profile.username}</span>
              </div>
              <div className="account_field">
                <span className="account_label">{t("settings.email") || "Email"}:</span>
                <span className="account_value">{profile.email}</span>
              </div>
              <div className="account_field">
                <span className="account_label">{t("settings.balance") || "Баланс"}:</span>
                <span className="account_value">{profile.balance || "0.00"}</span>
              </div>
            </div>
          )}
          <button className="logout_button" onClick={handleLogout}>
            <FaSignOutAlt /> {t("settings.logout") || "Выйти из аккаунта"}
          </button>
        </section>

        {/* Уведомления */}
        <section className="settings_section">
          <h2 className="section_title">
            <FaBell className="section_icon" />
            {t("settings.notifications") || "Уведомления"}
          </h2>
          <div className="settings_options">
            <div className="notification_toggle_container">
              <label className="toggle_label">
                <input
                  type="checkbox"
                  className="notification_toggle"
                  checked={notificationsEnabled}
                  onChange={handleNotificationToggle}
                  disabled={saving || (!notificationPermission && 'Notification' in window && Notification.permission === 'denied')}
                />
                <span className="toggle_text">
                  {t("settings.notifications_enabled") || "Включить напоминания об учёбе"}
                </span>
              </label>
              {!notificationPermission && (!('Notification' in window) || Notification.permission !== 'granted') && (
                <p className="permission_hint">
                  {t("settings.notifications_permission_hint") || 
                    "Для работы уведомлений требуется разрешение браузера"}
                </p>
              )}
            </div>

            {notificationsEnabled && (
              <div className="time_selector_container">
                <div className="time_selector_label">
                  <FaClock className="time_icon" />
                  <span>{t("settings.notification_time") || "Время напоминания"}</span>
                </div>
                <div className="time_selectors">
                  <div className="time_selector">
                    <label>{t("settings.hour") || "Час"}</label>
                    <select
                      value={notificationHour}
                      onChange={(e) => {
                        setNotificationHour(parseInt(e.target.value));
                        handleTimeChange();
                      }}
                      className="time_input"
                      disabled={saving}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="time_separator">:</span>

                  <div className="time_selector">
                    <label>{t("settings.minute") || "Минута"}</label>
                    <select
                      value={notificationMinute}
                      onChange={(e) => {
                        setNotificationMinute(parseInt(e.target.value));
                        handleTimeChange();
                      }}
                      className="time_input"
                      disabled={saving}
                    >
                      {[0, 15, 30, 45].map(m => (
                        <option key={m} value={m}>
                          {String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="time_preview">
                  {t("settings.notification_preview") || "Напоминание будет приходить каждый день в"} 
                  {" "}{String(notificationHour).padStart(2, '0')}:{String(notificationMinute).padStart(2, '0')}
                </p>
              </div>
            )}
          </div>
        </section>

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
      </div>
    </div>
  );
};

export default Settings;
