import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Capture and suppress benign Vite HMR / WebSocket connection errors
if (typeof window !== "undefined") {
  const ignoreError = (message: string, reason: any) => {
    const errorStr = String(message || "") + " " + String(reason || "") + " " + String(reason?.message || "");
    return (
      errorStr.includes("WebSocket") ||
      errorStr.includes("vite") ||
      errorStr.includes("HMR") ||
      errorStr.includes("ws://") ||
      errorStr.includes("wss://")
    );
  };

  window.addEventListener("unhandledrejection", (event) => {
    if (ignoreError(event.reason?.message, event.reason)) {
      event.preventDefault();
      event.stopPropagation();
      console.warn("[Vite/HMR Bypass] Ignored expected websocket disconnection event:", event.reason);
    }
  }, { capture: true });

  window.addEventListener("error", (event) => {
    if (ignoreError(event.message, event.error)) {
      event.preventDefault();
      event.stopPropagation();
      console.warn("[Vite/HMR Bypass] Ignored expected connection error event:", event.message);
    }
  }, { capture: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

