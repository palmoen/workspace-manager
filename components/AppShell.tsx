"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/assets", label: "Dashboard" },
  { href: "/admin/print", label: "QR-print" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div style={{ minHeight: "100vh", background: "#F0F2F5", display: "flex", flexDirection: "column" }}>
      <header style={{
        background: "#1C2233",
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 1.5rem",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
      }}>
        <a href="/admin/assets" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <img
            src="/logo-horisontal.svg"
            alt="Kontorcompaniet"
            style={{ height: 26, filter: "brightness(0) invert(1)" }}
          />
        </a>

        {/* Desktop nav */}
        <nav className="wm-desktop-nav" style={{ gap: "0.25rem" }}>
          {NAV.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <a
                key={href}
                href={href}
                style={{
                  color: active ? "#fff" : "#9ca3af",
                  padding: "0.4rem 0.85rem",
                  borderRadius: 6,
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  background: active ? "rgba(255,255,255,0.13)" : "transparent",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {label}
              </a>
            );
          })}
        </nav>

        {/* Hamburger */}
        <button
          className="wm-hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Meny"
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            padding: "0.25rem",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{
          position: "fixed",
          top: 56,
          left: 0,
          right: 0,
          background: "#1C2233",
          zIndex: 99,
          padding: "0.5rem 1rem 1rem",
          boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
        }}>
          {NAV.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  color: active ? "#fff" : "#d1d5db",
                  padding: "0.9rem 0.5rem",
                  fontWeight: active ? 600 : 400,
                  fontSize: "1rem",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {label}
              </a>
            );
          })}
        </div>
      )}

      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
