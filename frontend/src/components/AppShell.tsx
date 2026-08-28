import {
  Bank,
  FolderOpen,
  GearSix,
  House,
  Lifebuoy,
  List,
  Scales,
  X
} from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { WalletSessionProvider } from "./WalletSessionContext";
import { WalletStatus } from "./WalletStatus";

const navItems = [
  { to: "/", label: "Home", icon: House },
  { to: "/workflows", label: "Workflows", icon: FolderOpen },
  { to: "/credits", label: "Credits", icon: Bank },
  { to: "/settings", label: "Settings", icon: GearSix },
  { to: "/help", label: "Help", icon: Lifebuoy }
];

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <WalletSessionProvider>
      <div className="app-shell terranova-shell" data-testid="terranova-shell">
        <header className="topbar">
          <div className="topbar-inner">
            <NavLink className="brand" to="/" aria-label="TraceSettle home">
              <span className="brand-mark" aria-hidden="true">
                <Scales size={20} weight="bold" />
              </span>
              <span>TraceSettle</span>
            </NavLink>
            <button
              className="menu-trigger"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="app-menu"
              onClick={() => setMenuOpen((value) => !value)}
            >
              <List size={20} weight="bold" aria-hidden="true" />
              <span>Menu</span>
            </button>
            <WalletStatus />
          </div>
        </header>
        {menuOpen && (
          <div className="menu-layer">
            <button
              className="menu-backdrop"
              type="button"
              aria-label="Dismiss navigation backdrop"
              onClick={() => setMenuOpen(false)}
            />
            <aside
              id="app-menu"
              className="app-menu open"
              role="dialog"
              aria-label="Primary navigation"
            >
              <div className="app-menu__head">
                <span className="page-kicker">TraceSettle / Navigate</span>
                <button
                  className="menu-close"
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                >
                  <X size={22} weight="bold" aria-hidden="true" />
                </button>
              </div>
              <nav aria-label="Primary">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      className="app-menu__link"
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon size={19} weight="bold" aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}
        <main>{children}</main>
      </div>
    </WalletSessionProvider>
  );
}
