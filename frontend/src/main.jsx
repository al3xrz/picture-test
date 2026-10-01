import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ColorModeProvider from "./ColorModeContext";
import App from "./App";

// Точка входа: монтирует приложение с роутером и провайдером темы.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ColorModeProvider>
        <App />
      </ColorModeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
