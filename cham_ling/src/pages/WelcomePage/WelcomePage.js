import ThemeButton from "../../components/ThemeButton";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import "./WelcomePage.css";
import { useState } from "react";
import LoginModal from "../../components/LoginModal";
import { useNavigate } from "react-router-dom";

const WelcomePage = () => {
  const { t } = useTranslation();
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="container">
      <header className="header">
        <img src="logo.png" alt="Logo" className="logo" />
        <h1 className="title">Cham Ling</h1>
        <ThemeButton />
        <LanguageSwitcher />
      </header>
      <main>
        <h1>{t("welcome")}</h1>
        <div>
          <h1>Welcome!</h1>

          <button onClick={() => setShowLogin(true)}>Login</button>
          <button onClick={() => navigate("/register")}>Register</button>

          {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;
