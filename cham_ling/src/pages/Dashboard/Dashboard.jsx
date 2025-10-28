import "./Dashboard.css";
import { useTranslation } from "react-i18next";
import { useNavigate, Outlet } from "react-router-dom";
import { Classic } from "@theme-toggles/react";
import { useContext, useState } from "react";
import { ThemeContext } from "../../Theme";
import {
  FaBars,
  FaBookMedical,
  FaBook,
  FaShoppingCart,
  FaCog,
} from "react-icons/fa";
const Dashboard = () => {
  const { toggleTheme } = useContext(ThemeContext);
  const [isToggled, setToggle] = useState(false);
  const { t } = useTranslation();
  const [showButtons, setShowButtons] = useState(false);
  const navigate = useNavigate();

  const toggleButtons = () => setShowButtons((prev) => !prev);

  return (
    <div className="wrapper">
      <div className="container">
        <div className="dashboard_header">
          <div className="dashboard_logo_title">
            <button className="menu_button" onClick={toggleButtons}>
              <FaBars className="menu_icon" />
            </button>
            <img src="/logo.png" alt="Logo" className="dashboard_logo" />
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
        <div className="dashboard_content">
          <div className="dashboard_panel">
            <div className="dashboard_desktop">
              <button
                className="dash_button_desktop"
                onClick={() => navigate("/dashboard/my-dict")}
              >
                <FaBook className="book_icon" />
                <span
                  className={`button_text ${showButtons ? "show_buttons" : ""}`}
                >
                  {t("dashboard.button_my-dict")}
                </span>
              </button>

              <button
                className="dash_button_desktop"
                onClick={() => navigate("/dashboard/add-dict")}
              >
                <FaBookMedical className="book_icon" />
                <span
                  className={`button_text ${showButtons ? "show_buttons" : ""}`}
                >
                  {t("dashboard.button_create-dict")}
                </span>
              </button>

              <button
                className="dash_button_desktop"
                onClick={() => navigate("/dashboard/buy-dict")}
              >
                <FaShoppingCart className="book_icon" />
                <span
                  className={`button_text ${showButtons ? "show_buttons" : ""}`}
                >
                  {t("dashboard.button_buy_dict")}
                </span>
              </button>

              <button
                className="dash_button_desktop"
                onClick={() => navigate("/dashboard/settings")}
              >
                <FaCog className="book_icon" />
                <span
                  className={`button_text ${showButtons ? "show_buttons" : ""}`}
                >
                  {t("dashboard.button_settings")}
                </span>
              </button>
            </div>
          </div>

          <div className="dashboard_mobile">
            <button
              className="dash_button_mobile"
              onClick={() => navigate("/dashboard/my-dict")}
            >
              {t("dashboard.button_my-dict")}
            </button>
            <button
              className="dash_button_mobile"
              onClick={() => navigate("/dashboard/add-dict")}
            >
              {t("dashboard.button_create-dict")}
            </button>
            <button
              className="dash_button_mobile"
              onClick={() => navigate("/dashboard/buy-dict")}
            >
              {t("dashboard.button_buy_dict")}
            </button>
            <button
              className="dash_button_mobile"
              onClick={() => navigate("/dashboard/settings")}
            >
              {t("dashboard.button_settings")}
            </button>
          </div>

          <div className="dashboard_children">
            <Outlet /> {/* ← сюда будет подставляться активная страница */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
