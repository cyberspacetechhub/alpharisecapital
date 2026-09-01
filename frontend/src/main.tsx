import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Enforce permanent dark theme
document.documentElement.classList.add("dark");
localStorage.setItem("theme", "dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
