import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ResultPage from "./pages/ResultPage";

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen text-[var(--text)]">
      <Navbar theme={theme} onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))} />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/check" element={<HomePage />} />
          <Route path="/result/:reportId" element={<ResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
