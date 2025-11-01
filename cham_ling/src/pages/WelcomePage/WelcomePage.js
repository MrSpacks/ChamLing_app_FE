import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import LoginModal from "../../components/LoginModal/LoginModal";
import Button from "../../components/Buttons/Button";
import PageLayout from "../../components/PageLayout";
import "./WelcomePage.css";

const WelcomePage = () => {
  const { t } = useTranslation();
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  return (
    <PageLayout>
      
      <div className="welcome_logo_container">
        <img src="logo.png" alt="Logo" className="logo" />
        <h1 className="titleWP">ChamLing</h1>
      </div>

      <h1>{t("welcome")}</h1>
      <h2 className="subtitle">{t("welcome.subtitle")}</h2>

      <div className="button_group">
        <Button onClick={() => setShowLogin(true)} text={t("login")} />
        <Button onClick={() => navigate("/register")} text={t("register")} />
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      
    </PageLayout>

  );
};

export default WelcomePage;
