import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { OrgChartPage } from "./pages/OrgChartPage";
import { DirectoryPage } from "./pages/DirectoryPage";
import { ImportPage } from "./pages/ImportPage";
import { ConflictsPage } from "./pages/ConflictsPage";

export function App() {
  const { session, loading } = useAuth();

  if (loading) return <p style={{ padding: 24 }}>Cargando...</p>;

  if (!session) return <LoginPage />;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/organigrama" replace />} />
        <Route path="/organigrama" element={<OrgChartPage />} />
        <Route path="/directorio" element={<DirectoryPage />} />
        <Route path="/importacion" element={<ImportPage />} />
        <Route path="/conflictos" element={<ConflictsPage />} />
      </Routes>
    </AppShell>
  );
}
