import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./Theme";
import { BrowserRouter } from "react-router-dom";
import { registerServiceWorker } from "./utils/notifications";
import { initTextToSpeech } from "./utils/textToSpeech";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <BrowserRouter>
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  </BrowserRouter>
);

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker();
  });
}

// Инициализация Text-to-Speech
initTextToSpeech();
