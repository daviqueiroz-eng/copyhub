import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PomodoroProvider } from "@/contexts/PomodoroContext";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <PomodoroProvider>
      <App />
    </PomodoroProvider>
  </ThemeProvider>
);
