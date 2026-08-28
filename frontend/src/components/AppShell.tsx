import {
  Bank,
  FolderOpen,
  GearSix,
  House,
  Lifebuoy,
  List,
  X
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { WalletSessionProvider } from "./WalletSessionContext";
import { WalletStatus } from "./WalletStatus";

const TERRANOVA_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260816_125506_3a597378-ec85-4ebd-bd22-03b45508ac62.mp4";

const navItems = [
  { to: "/", label: "Home", icon: House },
  { to: "/workflows", label: "Workflows", icon: FolderOpen },
  { to: "/credits", label: "Credits", icon: Bank },
  { to: "/settings", label: "Settings", icon: GearSix },
  { to: "/help", label: "Help", icon: Lifebuoy }
];

function TraceSettleLogoMark() {
  return (
    <svg
      className="logo-mark-svg"
      data-testid="tracesettle-logo-mark"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="logo-mark-svg__field" cx="24" cy="24" r="23" />
      <path className="logo-mark-svg__ledger" d="M14 18h20M14 24h16M14 30h20" />
      <path className="logo-mark-svg__trace" d="M15 34 22 13l5 16 4-9 3 14" />
      <circle className="logo-mark-svg__node" cx="22" cy="13" r="2.5" />
      <circle className="logo-mark-svg__node" cx="27" cy="29" r="2.5" />
      <circle className="logo-mark-svg__node" cx="34" cy="34" r="2.5" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuCloseRef = useRef<HTMLButtonElement | null>(null);
  const menuWasOpenedRef = useRef(false);

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

  useEffect(() => {
    if (menuOpen) {
      menuWasOpenedRef.current = true;
      menuCloseRef.current?.focus({ preventScroll: true });
    } else if (menuWasOpenedRef.current) {
      menuTriggerRef.current?.focus({ preventScroll: true });
    }
  }, [menuOpen]);

  return (
    <WalletSessionProvider>
      <div className="app-shell terranova-shell" data-testid="terranova-shell">
        <video
          id="app-bg-video"
          className="bg-video"
          data-testid="terranova-video-backdrop"
          aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src={TERRANOVA_VIDEO_URL}
        />
        <svg className="glass-defs" width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <filter
              id="liquid-glass-refraction"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012 0.015"
                numOctaves="3"
                result="noise"
              />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                result="boosted_alpha"
                values="0 0 0 0 0
                        0 0 0 0 0
                        0 0 0 0 0
                        0 0 0 100 0"
              />
              <feGaussianBlur in="boosted_alpha" stdDeviation="45" result="blurred_alpha" />
              <feComponentTransfer in="blurred_alpha" result="edge_mask">
                <feFuncA type="linear" slope="-1.3" intercept="1" />
              </feComponentTransfer>
              <feComposite
                in="noise"
                in2="edge_mask"
                operator="arithmetic"
                k1="1"
                k2="0"
                k3="0"
                k4="0"
                result="masked_noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="masked_noise"
                scale="65"
                xChannelSelector="R"
                yChannelSelector="G"
                result="red_displaced"
              />
              <feColorMatrix
                in="red_displaced"
                type="matrix"
                result="red"
                values="1 0 0 0 0
                        0 0 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="masked_noise"
                scale="56"
                xChannelSelector="R"
                yChannelSelector="G"
                result="green_displaced"
              />
              <feColorMatrix
                in="green_displaced"
                type="matrix"
                result="green"
                values="0 0 0 0 0
                        0 1 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="masked_noise"
                scale="47"
                xChannelSelector="R"
                yChannelSelector="G"
                result="blue_displaced"
              />
              <feColorMatrix
                in="blue_displaced"
                type="matrix"
                result="blue"
                values="0 0 0 0 0
                        0 0 0 0 0
                        0 0 1 0 0
                        0 0 0 1 0"
              />
              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="chromatic_dispersion" />
            </filter>
          </defs>
        </svg>
        <header className="topbar">
          <div className="topbar-inner">
            <NavLink className="brand" to="/" aria-label="TraceSettle home">
              <span className="brand-mark" aria-hidden="true">
                <TraceSettleLogoMark />
              </span>
              <span>TraceSettle</span>
            </NavLink>
            <nav className="primary-nav" aria-label="Primary">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    className="primary-nav__link"
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                  >
                    <Icon size={16} weight="bold" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <button
              className="menu-trigger"
              type="button"
              ref={menuTriggerRef}
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
                  ref={menuCloseRef}
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
