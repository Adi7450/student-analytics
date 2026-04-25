"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CsvUpload } from "./CsvUpload";

const NAV = [
  { href: "/dashboard",   label: "Dashboard",      icon: "▦" },
  { href: "/descriptive", label: "Descriptive",     icon: "◈" },
  { href: "/probability", label: "Probability",     icon: "◉" },
  { href: "/inferential", label: "Inferential",     icon: "⊛" },
];

export function Sidebar() {
  const path = usePathname();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded]   = useState(false);
  const [rowCount, setRowCount]   = useState<number | null>(null);

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, width: 220,
      height: "100vh", background: "var(--bg-surface)",
      borderRight: "1px solid var(--bg-border)",
      display: "flex", flexDirection: "column",
      padding: "0", zIndex: 50, overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "1px solid var(--bg-border)" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, color: "var(--accent-amber)", letterSpacing: "-0.5px" }}>
          DeadlineIQ
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.5px" }}>
          STUDENT ANALYTICS
        </div>
      </div>

      {/* Upload zone */}
      <div style={{ padding: "1rem 1rem 0.75rem", borderBottom: "1px solid var(--bg-border)" }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "IBM Plex Mono, monospace", marginBottom: 8, letterSpacing: "0.5px" }}>
          DATA SOURCE
        </div>
        <CsvUpload
          onUploadStart={() => { setUploading(true); setUploaded(false); }}
          onUploadSuccess={(rows) => { setUploading(false); setUploaded(true); setRowCount(rows); }}
          onUploadError={() => setUploading(false)}
        />
        {uploaded && rowCount && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#4ade80", fontFamily: "IBM Plex Mono, monospace" }}>
            ✓ {rowCount} rows loaded
          </div>
        )}
        {uploading && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--accent-amber)", fontFamily: "IBM Plex Mono, monospace" }}>
            ⟳ Processing…
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0" }}>
        <div style={{ padding: "0 1rem 0.5rem", fontSize: 10, color: "var(--text-muted)", fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.5px" }}>
          ANALYSIS
        </div>
        {NAV.map(({ href, label, icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "0.6rem 1.25rem",
                background: active ? "rgba(251,191,36,0.08)" : "transparent",
                borderRight: active ? "2px solid var(--accent-amber)" : "2px solid transparent",
                color: active ? "var(--accent-amber)" : "var(--text-secondary)",
                fontSize: 13, fontWeight: active ? 500 : 400,
                transition: "all 0.15s ease", cursor: "pointer",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span style={{ fontSize: 14, opacity: active ? 1 : 0.5 }}>{icon}</span>
                <span>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--bg-border)", fontSize: 10, color: "var(--text-muted)", fontFamily: "IBM Plex Mono, monospace" }}>
        α = 0.05 · 95% CI
      </div>
    </aside>
  );
}
