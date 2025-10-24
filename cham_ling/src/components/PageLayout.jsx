// src/components/PageLayout/PageLayout.jsx
import React, { useContext, useState } from "react";
import { Classic } from "@theme-toggles/react";
import "@theme-toggles/react/css/Classic.css";
import { ThemeContext } from "../Theme";
import LanguageSwitcher from "./LanguageSwitcher/LanguageSwitcher";
import Footer from "./Footer/Footer";

const PageLayout = ({ children }) => {
  const { toggleTheme } = useContext(ThemeContext);
  const [isToggled, setToggle] = useState(false);

  return (
    <div className="wrapper">
      <div className="container">
        <header className="headerWP">
          <LanguageSwitcher />
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
        </header>

        <main>{children}</main>

        <footer>
          <Footer />
        </footer>
      </div>
    </div>
  );
};

export default PageLayout;
