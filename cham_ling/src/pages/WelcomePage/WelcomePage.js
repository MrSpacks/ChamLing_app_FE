import ThemeButton from "../../components/ThemeButton";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import "./WelcomePage.css";

const WelcomePage = () => {
  const { t } = useTranslation();
  return (
    <div className="container">
      <header className="header">
        <img src="logo.png" alt="Logo" className="logo" />
        <h1 className="title">Cham Ling</h1>
        <ThemeButton />
        <LanguageSwitcher />
        <h1>{t("welcome")}</h1>
        <p>
          {t("language")}: {navigator.language}
        </p>
      </header>
      <h1>Welcome to Cham Ling!</h1>
    </div>
  );
};

export default WelcomePage;
