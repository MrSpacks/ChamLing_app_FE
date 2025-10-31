import React, { useContext, useEffect } from "react";
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
import DictionaryDetail from "./pages/DictionaryDetail/DictionaryDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import InstallPrompt from "./components/InstallPrompt/InstallPrompt";
import { initInstallPrompt } from "./utils/pwaInstall";

function App() {
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    // Инициализируем отслеживание установки PWA
    initInstallPrompt();
  }, []);

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
        
        {/* Детальная страница словаря вне Dashboard */}
        <Route
          path="/dashboard/dictionary/:id"
          element={
            <ProtectedRoute>
              <DictionaryDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
      
      {/* Компонент предложения установки PWA */}
      <InstallPrompt />
    </div>
  );
}

export default App;
