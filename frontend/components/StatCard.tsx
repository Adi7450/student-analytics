interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "amber" | "teal" | "coral" | "green";
  delay?: number;
}

const ACCENT_COLORS = {
  amber: "var(--accent-amber)",
  teal:  "var(--accent-teal)",
  coral: "var(--accent-coral)",
  green: "#4ade80",
};

export function StatCard({ label, value, sub, accent = "amber", delay = 0 }: StatCardProps) {
  const color = ACCENT_COLORS[accent];
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--bg-border)",
      borderRadius: 12,
      padding: "1.25rem 1.5rem",
      position: "relative",
      overflow: "hidden",
      animation: `fadeUp 0.5s ease ${delay}ms both`,
    }}>
      {/* accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.7 }} />
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.5px", marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 28, fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
