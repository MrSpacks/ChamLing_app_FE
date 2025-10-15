import React, { useContext } from "react";
import "./i18n"; // Инициализация i18next
import "./App.css";
import "./reset.css";

import { ThemeContext } from "./Theme";
import WelcomePage from "./pages/WelcomePage/WelcomePage";

function App() {
  const { theme } = useContext(ThemeContext);

  return (
    <div className={`App ${theme}`}>
      <WelcomePage />
    </div>
  );
}

export default App;
