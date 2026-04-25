export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: 80, borderRadius: 12,
          background: "linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-elevated) 50%, var(--bg-surface) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }} />
      ))}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function NoData() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: 300, gap: 16,
      color: "var(--text-muted)", textAlign: "center",
    }}>
      <div style={{ fontSize: 48, opacity: 0.3 }}>⊘</div>
      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 18, color: "var(--text-secondary)" }}>
        No data loaded
      </div>
      <div style={{ fontSize: 13, maxWidth: 300 }}>
        Upload your Google Form CSV export using the panel in the sidebar to begin analysis.
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)",
      borderRadius: 12, padding: "1.5rem", color: "#fb7185",
    }}>
      <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, marginBottom: 6 }}>Error fetching data</div>
      <div style={{ fontSize: 13, fontFamily: "IBM Plex Mono, monospace", opacity: 0.8 }}>{message}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ marginTop: 4, fontSize: 14, color: "var(--text-muted)" }}>{subtitle}</p>
      )}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: 12 }}>
      {children}
    </div>
  );
}

export function ChartCard({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--bg-border)",
      borderRadius: 12, padding: "1.5rem", ...style,
    }}>
      <div style={{ fontSize: 12, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: 16 }}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );
}
