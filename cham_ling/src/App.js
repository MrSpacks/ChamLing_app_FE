/**
 * Главный компонент приложения ChamLing.
 * 
 * Определяет маршрутизацию приложения и управляет глобальными настройками:
 * - Инициализация i18n (интернационализация)
 * - Инициализация темы (светлая/тёмная)
 * - Инициализация PWA install prompt
 * - Маршрутизация между страницами
 * 
 * @module App
 */
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
import OfflineIndicator from "./components/OfflineIndicator/OfflineIndicator";
import { initInstallPrompt } from "./utils/pwaInstall";
import { initAutoSync } from "./utils/syncProgress";
import { saveLearningProgress } from "./api/auth";

/**
 * Главный компонент приложения.
 * 
 * Управляет маршрутизацией и инициализацией глобальных функций.
 * Все защищённые маршруты обёрнуты в ProtectedRoute для проверки авторизации.
 * 
 * @returns {JSX.Element} Корневой элемент приложения
 */
function App() {
  const { theme } = useContext(ThemeContext);

  // Инициализация PWA install prompt при монтировании компонента
  useEffect(() => {
    initInstallPrompt();
  }, []);

  // Инициализация автоматической синхронизации прогресса
  useEffect(() => {
    const unsubscribe = initAutoSync(saveLearningProgress);
    
    // Выполняем начальную синхронизацию если онлайн
    if (navigator.onLine) {
      import("./utils/syncProgress").then(({ syncQueue }) => {
        syncQueue(saveLearningProgress);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <div className={`App ${theme}`}>
      <Routes>
        {/* Публичные маршруты (доступны без авторизации) */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Защищённые маршруты - требуют авторизации через ProtectedRoute */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* Вложенные страницы внутри Dashboard */}
          {/* Редирект на /dashboard/my-dict по умолчанию */}
          <Route index element={<Navigate to="my-dict" replace />} />
          <Route path="settings" element={<Settings />} />
          <Route path="add-dict" element={<AddDict />} />
          <Route path="buy-dict" element={<BuyDict />} />
          <Route path="my-dict" element={<MyDict />} />
        </Route>
        
        {/* Детальная страница словаря (отдельный маршрут вне Dashboard) */}
        <Route
          path="/dashboard/dictionary/:id"
          element={
            <ProtectedRoute>
              <DictionaryDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
      
      {/* Компонент предложения установки PWA (показывается при наличии возможности) */}
      <InstallPrompt />
      
      {/* Индикатор офлайн статуса */}
      <OfflineIndicator />
    </div>
  );
}

export default App;
