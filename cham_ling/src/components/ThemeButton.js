import { ThemeContext } from "../Theme";
import React, { useContext } from "react";

const ThemeButton = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return <button onClick={() => toggleTheme()}>{theme}</button>;
};
export default ThemeButton;
