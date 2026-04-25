"use client";
import { SolutionsResponse, Recommendation } from "@/lib/api";

const SEVERITY_CONFIG = {
  alert:   { label: "ALERT",   color: "#fb7185", bg: "rgba(251,113,133,0.08)", border: "rgba(251,113,133,0.2)",  icon: "⚠" },
  warning: { label: "WARNING", color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)",   icon: "◉" },
  info:    { label: "INSIGHT", color: "#2dd4bf", bg: "rgba(45,212,191,0.08)",  border: "rgba(45,212,191,0.2)",   icon: "◈" },
  success: { label: "GOOD",    color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)",   icon: "✓" },
};

const HEALTH_CONFIG = {
  "at-risk":   { color: "#fb7185", label: "AT RISK",   width: "15%" },
  "concerning":{ color: "#fbbf24", label: "CONCERNING", width: "40%" },
  "moderate":  { color: "#2dd4bf", label: "MODERATE",  width: "65%" },
  "good":      { color: "#4ade80", label: "GOOD",      width: "85%" },
};

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const cfg = SEVERITY_CONFIG[rec.severity];
  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 10, padding: "1.25rem",
      animation: `fadeUp 0.4s ease ${index * 80}ms both`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ fontSize: 16, color: cfg.color, marginTop: 1 }}>{cfg.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 9, fontFamily: "IBM Plex Mono, monospace", fontWeight: 600,
              color: cfg.color, background: `${cfg.border}`, border: `1px solid ${cfg.border}`,
              padding: "2px 6px", borderRadius: 4, letterSpacing: "0.5px",
            }}>
              {cfg.label}
            </span>
            <span style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)" }}>
              {rec.metric_trigger}
            </span>
          </div>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>
            {rec.title}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {rec.detail}
          </div>
          {rec.projected_improvement && (
            <div style={{
              marginTop: 10, padding: "8px 12px",
              background: "rgba(255,255,255,0.03)", borderRadius: 6,
              fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5,
              borderLeft: `2px solid ${cfg.color}`,
            }}>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", color: cfg.color, fontSize: 10 }}>PROJECTION · </span>
              {rec.projected_improvement}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SolutionsPanel({ data }: { data: SolutionsResponse }) {
  const hcfg = HEALTH_CONFIG[data.overall_health];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Health score gauge */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--bg-border)",
        borderRadius: 12, padding: "1.5rem",
      }}>
        <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: 12 }}>
          COHORT HEALTH SCORE
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 48, fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: hcfg.color }}>
            {data.health_score.toFixed(0)}
          </span>
          <span style={{ fontSize: 20, color: "var(--text-muted)", fontFamily: "IBM Plex Mono, monospace" }}>/100</span>
          <span style={{
            fontSize: 11, fontFamily: "IBM Plex Mono, monospace", fontWeight: 600,
            color: hcfg.color, padding: "2px 10px", borderRadius: 20,
            background: `${hcfg.color}18`, border: `1px solid ${hcfg.color}40`,
          }}>
            {hcfg.label}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 6, background: "var(--bg-border)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${data.health_score}%`,
            background: hcfg.color, borderRadius: 3,
            transition: "width 1s ease",
          }} />
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {data.summary}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: 12 }}>
          RECOMMENDATIONS ({data.recommendations.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
