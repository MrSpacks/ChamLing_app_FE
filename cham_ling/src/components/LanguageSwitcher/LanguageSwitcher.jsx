import { useTranslation } from "react-i18next";
import "./LanguageSwitcher.css";
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
  };

  return (
    <select
      className="change_language"
      value={i18n.language}
      onChange={changeLanguage}
    >
      <option className="option_language" value="en">
        English
      </option>
      <option className="option_language" value="ru">
        Русский
      </option>
    </select>
  );
}
