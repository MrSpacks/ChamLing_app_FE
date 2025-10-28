import "./Settings.css";
import { useTranslation } from "react-i18next";

const Settings = () => {
  const { t } = useTranslation();

  return (
    <div className="settings_wrapper">
      <h1 className="settings_title">{t("settings.title")}</h1>
      {/* Settings content goes here */}
    </div>
  );
};

export default Settings;
