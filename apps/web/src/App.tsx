import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { OrgChartPage } from "./pages/OrgChartPage";
import { DirectoryPage } from "./pages/DirectoryPage";
import { ImportPage } from "./pages/ImportPage";
import { ConflictsPage } from "./pages/ConflictsPage";

import { HelpPage } from "./pages/HelpPage";

export function App() {
  // Eliminamos el chequeo de sesión para acceso directo
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/organigrama" replace />} />
        <Route path="/organigrama" element={<OrgChartPage />} />
        <Route path="/directorio" element={<DirectoryPage />} />
        <Route path="/importacion" element={<ImportPage />} />
        <Route path="/conflictos" element={<ConflictsPage />} />
        <Route path="/ayuda" element={<HelpPage />} />
      </Routes>
    </AppShell>
  );
}
