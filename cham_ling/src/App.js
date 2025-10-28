import React, { useContext } from "react";
import "./i18n";
import "./App.css";
import "./reset.css";

import { ThemeContext } from "./Theme";
import { Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage/WelcomePage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Settings from "./pages/Settings/Settings";
import AddDict from "./pages/AddDict/AddDict";
import BuyDict from "./pages/BuyDict/BuyDict";
import MyDict from "./pages/MyDict/MyDict";
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
        >
          {/* Вложенные страницы внутри Dashboard */}
          <Route index element={<Navigate to="my-dict" replace />} />
          <Route path="settings" element={<Settings />} />
          <Route path="add-dict" element={<AddDict />} />
          <Route path="buy-dict" element={<BuyDict />} />
          <Route path="my-dict" element={<MyDict />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
