import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PomodoroProvider } from "@/contexts/PomodoroContext";

// Auto-recovery de cache: detecta build novo e limpa cache de assets
// (não toca em localStorage / sessão de login)
(async () => {
  try {
    const currentBuild = __BUILD_TIME__;
    const lastBuild = localStorage.getItem("app_build_time");
    if (lastBuild && lastBuild !== currentBuild) {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) await reg.unregister();
      }
    }
    localStorage.setItem("app_build_time", currentBuild);
  } catch {
    // ignore
  }
})();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <PomodoroProvider>
      <App />
    </PomodoroProvider>
  </ThemeProvider>
);
