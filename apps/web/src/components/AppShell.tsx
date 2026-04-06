import { Link, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";

const navItems = [
  { to: "/organigrama", label: "Organigrama" },
  { to: "/directorio", label: "Directorio" },
  { to: "/importacion", label: "Importación" },
  { to: "/conflictos", label: "Conflictos" }
];

export function AppShell({ children }: PropsWithChildren) {
  const { pathname } = useLocation();

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Organigrama MVP</h1>
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
      </header>
      <main>{children}</main>
    </div>
  );
}
