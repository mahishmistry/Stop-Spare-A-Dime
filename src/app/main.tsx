import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// @ts-ignore 
import "../styles/index.css";
import App from "./App.tsx"; // App.tsx
import React from "react";

// main.tsx initializes the application with react, enabling App.tsx to render UI
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
