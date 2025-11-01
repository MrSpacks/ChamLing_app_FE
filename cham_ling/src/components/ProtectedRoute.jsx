/**
 * Компонент для защиты маршрутов, требующих авторизации.
 * 
 * Проверяет наличие JWT токенов в localStorage и перенаправляет
 * неавторизованных пользователей на страницу регистрации.
 * 
 * @module components/ProtectedRoute
 */
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

/**
 * Компонент-обёртка для защищённых маршрутов.
 * 
 * Проверяет наличие access и refresh токенов в localStorage.
 * Если токены отсутствуют, перенаправляет пользователя на /register.
 * 
 * @param {Object} props - Свойства компонента
 * @param {React.ReactNode} props.children - Дочерние компоненты для отображения при авторизации
 * @returns {React.ReactNode|JSX.Element} Дочерние компоненты или Navigate на /register
 * 
 * @example
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Проверка авторизации при монтировании компонента
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    
    // Проверяем наличие токенов для определения авторизации
    // Достаточно наличия хотя бы одного токена (access или refresh)
    if (!token && !refreshToken) {
      setIsAuthenticated(false);
    } else if (token) {
      setIsAuthenticated(true);
    } else if (refreshToken) {
      // Если есть только refresh токен, в будущем можно попытаться обновить access токен
      // Для простоты считаем, что если нет access токена - нужно залогиниться заново
      setIsAuthenticated(false);
    }
  }, []);

  // Показываем ничего во время проверки авторизации
  // Можно заменить на компонент загрузки (Loader)
  if (isAuthenticated === null) {
    return null;
  }

  // Если пользователь не авторизован — редирект на страницу регистрации/логина
  if (!isAuthenticated) {
    return <Navigate to="/register" replace />;
  }

  // Если авторизован — отображаем защищённый контент
  return children;
}
