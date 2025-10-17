import React from "react";
import { Navigate } from "react-router-dom";

// Оборачивает защищённые страницы
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    // Если пользователь не авторизован — редирект на регистрацию / логин
    return <Navigate to="/register" replace />;
  }

  return children;
}
