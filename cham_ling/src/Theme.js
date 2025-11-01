/**
 * Контекст темы для управления светлой/тёмной темой приложения.
 * 
 * Сохраняет выбранную тему в localStorage и предоставляет
 * функции для переключения между темами во всём приложении.
 * 
 * @module Theme
 */
import React, { useEffect, createContext, useState } from "react";

const ThemeContext = createContext();

/**
 * Получает сохранённую тему из localStorage.
 * 
 * Если тема не сохранена, устанавливает тёмную тему по умолчанию
 * и сохраняет её в localStorage.
 * 
 * @returns {string} Название темы ('dark-theme' или 'light-theme')
 */
const getTheme = () => {
  const theme = localStorage.getItem("theme");
  if (!theme) {
    // Тёмная тема установлена по умолчанию
    localStorage.setItem("theme", "dark-theme");
    return "dark-theme";
  } else {
    return theme;
  }
};

/**
 * Провайдер контекста темы.
 * 
 * Управляет состоянием темы и предоставляет функции для переключения.
 * Автоматически сохраняет изменения темы в localStorage.
 * 
 * @param {Object} props - Свойства компонента
 * @param {React.ReactNode} props.children - Дочерние компоненты
 * @returns {JSX.Element} ThemeContext.Provider с темой и функциями управления
 * 
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getTheme);

  /**
   * Переключает тему между тёмной и светлой.
   * 
   * Меняет значение theme state, что автоматически запускает
   * useEffect для сохранения новой темы в localStorage.
   */
  function toggleTheme() {
    if (theme === "dark-theme") {
      setTheme("light-theme");
    } else {
      setTheme("dark-theme");
    }
  }

  // Автоматически сохраняем тему в localStorage при её изменении
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,        // Текущая тема ('dark-theme' или 'light-theme')
        setTheme,     // Функция для прямого установления темы
        toggleTheme,  // Функция для переключения темы
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext, ThemeProvider };
