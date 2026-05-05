import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ResultPage from "./pages/ResultPage";

export default function App() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="min-h-screen">
      <Navbar theme={theme} onToggleTheme={() => setTheme("dark")} />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/result/:reportId" element={<ResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
