import { Link, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { useAuth } from "../lib/AuthContext";

const navItems = [
  { to: "/organigrama", label: "Organigrama" },
  { to: "/directorio", label: "Directorio" },
  { to: "/importacion", label: "Importación" },
  { to: "/conflictos", label: "Conflictos" },
  { to: "/ayuda", label: "Ayuda" }
];

export function AppShell({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  const { session, signOut } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Organigrama v0.3.4</h1>
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={pathname === item.to ? "nav-link active" : "nav-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {session && (
          <button className="btn-logout" type="button" onClick={() => void signOut()}>
            Salir
          </button>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
