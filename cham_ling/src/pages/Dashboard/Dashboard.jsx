import "./Dashboard.css";
import { useTranslation } from "react-i18next";
import {
  DashButtonDesktop,
  DashButtonMobile,
} from "../../components/Buttons/DashButton";
import { Classic } from "@theme-toggles/react";
import { useContext, useState } from "react";
import { ThemeContext } from "../../Theme";

const Dashboard = ({ children }) => {
  const { toggleTheme } = useContext(ThemeContext);
  const [isToggled, setToggle] = useState(false);
  const { t } = useTranslation();
  return (
    <div className="wrapper">
      <div className="container">
        <div className="dashboard_header">
          <div className="dashboard_logo_title">
            <img src="logo.png" alt="Logo" className="dashboard_logo" />
            <h1 className="dashboard_title">{t("dashboard.title")}</h1>
          </div>
          <Classic
            className="ThemeButton"
            toggled={isToggled}
            toggle={setToggle}
            duration={500}
            onClick={() => {
              setToggle((prev) => !prev);
              toggleTheme();
            }}
          />
        </div>
        <div className="dashboard_panel">
          <div className="dashboard_desktop">
            <DashButtonDesktop
              onClick={() => alert("Desktop Button Clicked")}
              text={t("dashboard.button_my-dict")}
            />
            <DashButtonDesktop
              onClick={() => alert("Desktop Button Clicked")}
              text={t("dashboard.button_create-dict")}
            />
            <DashButtonDesktop
              onClick={() => alert("Desktop Button Clicked")}
              text={t("dashboard.button_buy_dict")}
            />
            <DashButtonDesktop
              onClick={() => alert("Desktop Button Clicked")}
              text={t("dashboard.button_settings")}
            />
          </div>
        </div>
        <div className="dashboard_mobile">
          <DashButtonMobile
            onClick={() => alert("Mobile Button Clicked")}
            text={t("dashboard.button_my-dict")}
          />
          <DashButtonMobile
            onClick={() => alert("Mobile Button Clicked")}
            text={t("dashboard.button_create-dict")}
          />

          <DashButtonMobile
            onClick={() => alert("Mobile Button Clicked")}
            text={t("dashboard.button_buy_dict")}
          />
          <DashButtonMobile
            onClick={() => alert("Mobile Button Clicked")}
            text={t("dashboard.button_settings")}
          />
        </div>

        <div className="dashboard-children">{children}</div>
      </div>
    </div>
  );
};

export default Dashboard;
