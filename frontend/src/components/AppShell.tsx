import {
  Bank,
  FolderOpen,
  GearSix,
  House,
  Lifebuoy,
  Scales
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
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
  return (
    <WalletSessionProvider>
      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-inner">
            <NavLink className="brand" to="/" aria-label="TraceSettle home">
              <span className="brand-mark" aria-hidden="true">
                <Scales size={20} weight="bold" />
              </span>
              <span>TraceSettle</span>
            </NavLink>
            <nav className="primary-nav" aria-label="Primary">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} end={item.to === "/"}>
                    <Icon size={17} weight="bold" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            <WalletStatus />
          </div>
        </header>
        <main>{children}</main>
      </div>
    </WalletSessionProvider>
  );
}
