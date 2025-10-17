import React, { useContext } from "react";
import "./i18n";
import "./App.css";
import "./reset.css";

import { ThemeContext } from "./Theme";
import { Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage/WelcomePage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import Dashboard from "./pages/Dashboard/Dashboard";

// импортируем защитный компонент
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const { theme } = useContext(ThemeContext);

  return (
    <div className={`App ${theme}`}>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Защищённые маршруты */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
