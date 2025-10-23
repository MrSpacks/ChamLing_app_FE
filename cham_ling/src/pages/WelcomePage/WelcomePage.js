import LanguageSwitcher from "../../components/LanguageSwitcher/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import "./WelcomePage.css";
import { useState } from "react";
import LoginModal from "../../components/LoginModal/LoginModal";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Buttons/Button";
import "@theme-toggles/react/css/Classic.css";
import { Classic } from "@theme-toggles/react";
import { ThemeContext } from "../../Theme";
import React, { useContext } from "react";
import Footer from "../../components/Footer/Footer";
const WelcomePage = () => {
  const { t } = useTranslation();
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const { toggleTheme } = useContext(ThemeContext);
  const [isToggled, setToggle] = useState(false); // for toggle button
  return (
    <div className="wrapper">
      <div className="container">
        <header className="headerWP">
          <LanguageSwitcher />
          <Classic
            className="ThemeButton"
            toggled={isToggled} // состояние переключателя
            toggle={setToggle} // функция для обновления состояния
            duration={500} // скорость анимации
            onClick={() => {
              setToggle((prev) => !prev); // обновляем локальное состояние
              toggleTheme(); // вызываем свою функцию
            }}
          />
        </header>
        <main>
          <div className="logoContainer">
            <img src="logo.png" alt="Logo" className="logo" />
            <h1 className="titleWP">ChamLing</h1>
          </div>
          <h1>{t("welcome")}</h1>
          <div>
            <h2 className="subtitle">{t("welcome.subtitle")}</h2>
            <div className="button_group">
              <Button onClick={() => setShowLogin(true)} text={t("login")} />
              <Button
                onClick={() => navigate("/register")}
                text={t("register")}
              />
            </div>

            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
          </div>
        </main>
        <footer>
          <Footer />
        </footer>
      </div>
    </div>
  );
};

export default WelcomePage;
