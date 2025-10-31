import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

// Оборачивает защищённые страницы
export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    
    // Проверяем наличие токенов
    if (!token && !refreshToken) {
      setIsAuthenticated(false);
    } else if (token) {
      setIsAuthenticated(true);
    } else if (refreshToken) {
      // Если есть только refresh токен, пытаемся обновить access токен
      // Но для простоты пока считаем что если нет access токена - нужно залогиниться
      setIsAuthenticated(false);
    }
  }, []);

  // Показываем ничего пока проверяем
  if (isAuthenticated === null) {
    return null; // или можно показать лоадер
  }

  if (!isAuthenticated) {
    // Если пользователь не авторизован — редирект на регистрацию / логин
    return <Navigate to="/register" replace />;
  }

  return children;
}
