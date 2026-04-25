"use client";
import { HypothesisResponse } from "@/lib/api";

function VerdictBadge({ reject }: { reject: boolean }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: "IBM Plex Mono, monospace", fontWeight: 600,
      padding: "3px 10px", borderRadius: 20,
      color: reject ? "#fb7185" : "#4ade80",
      background: reject ? "rgba(251,113,133,0.12)" : "rgba(74,222,128,0.12)",
      border: `1px solid ${reject ? "rgba(251,113,133,0.3)" : "rgba(74,222,128,0.3)"}`,
    }}>
      {reject ? "REJECT H₀" : "FAIL TO REJECT H₀"}
    </span>
  );
}

function CIBar({ lower, upper, mean, label }: { lower: number; upper: number; mean: number; label: string }) {
  const range = upper - lower;
  const scale = 200 / (range || 1);
  const offset = (mean - lower) * scale;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)", minWidth: 50, textAlign: "right" }}>
          {lower.toFixed(2)}
        </span>
        <div style={{ flex: 1, position: "relative", height: 8 }}>
          <div style={{ position: "absolute", inset: "2px 0", background: "rgba(45,212,191,0.15)", borderRadius: 4, border: "1px solid rgba(45,212,191,0.3)" }} />
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: 8, height: 8, background: "var(--accent-teal)", borderRadius: "50%",
          }} />
        </div>
        <span style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)", minWidth: 50 }}>
          {upper.toFixed(2)}
        </span>
      </div>
      <div style={{ textAlign: "center", fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: "var(--accent-teal)", marginTop: 4 }}>
        μ = {mean.toFixed(3)}
      </div>
    </div>
  );
}

export function HypothesisPanel({ data }: { data: HypothesisResponse }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* H0 / H1 */}
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: 10, padding: "1.25rem" }}>
        <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: 10 }}>HYPOTHESES</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", color: "#4ade80", marginRight: 8 }}>H₀</span>{data.h0}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", color: "var(--accent-coral)", marginRight: 8 }}>H₁</span>{data.h1}
          </div>
        </div>
      </div>

      {/* T-test */}
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: 10, padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)", letterSpacing: "0.5px" }}>WELCH'S INDEPENDENT T-TEST</div>
          <VerdictBadge reject={data.t_test.reject_null} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          {[
            { k: "t-statistic", v: data.t_test.t_statistic.toFixed(4) },
            { k: "p-value",     v: data.t_test.p_value < 0.001 ? "< 0.001" : data.t_test.p_value.toFixed(4) },
            { k: "α level",     v: "0.05" },
          ].map(({ k, v }) => (
            <div key={k}>
              <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)" }}>{k}</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 18, fontWeight: 600, color: "var(--accent-amber)" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: 8, padding: "0.75rem" }}>
            <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--accent-teal)" }}>EARLY GROUP (n={data.t_test.early_group_n})</div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 22, fontWeight: 600, color: "var(--accent-teal)" }}>{data.t_test.early_group_mean.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>mean marks /10</div>
          </div>
          <div style={{ background: "rgba(251,113,133,0.06)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: 8, padding: "0.75rem" }}>
            <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--accent-coral)" }}>LATE GROUP (n={data.t_test.late_group_n})</div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 22, fontWeight: 600, color: "var(--accent-coral)" }}>{data.t_test.late_group_mean.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>mean marks /10</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{data.t_test.interpretation}</div>
      </div>

      {/* Proportion test */}
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: 10, padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)", letterSpacing: "0.5px" }}>PROPORTION Z-TEST (ABOVE-AVERAGE MARKS)</div>
          <VerdictBadge reject={data.proportion_test.reject_null} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          {[
            { k: "z-statistic",       v: data.proportion_test.z_statistic.toFixed(4) },
            { k: "p-value",           v: data.proportion_test.p_value < 0.001 ? "< 0.001" : data.proportion_test.p_value.toFixed(4) },
            { k: "on-time rate",      v: `${(data.proportion_test.on_time_above_avg_rate * 100).toFixed(1)}%` },
          ].map(({ k, v }) => (
            <div key={k}>
              <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)" }}>{k}</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 18, fontWeight: 600, color: "var(--accent-amber)" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{data.proportion_test.interpretation}</div>
      </div>

      {/* Confidence intervals */}
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: 10, padding: "1.25rem" }}>
        <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: 16 }}>
          95% CONFIDENCE INTERVALS
        </div>
        <CIBar
          label={data.ci_completion_time.label}
          lower={data.ci_completion_time.lower}
          upper={data.ci_completion_time.upper}
          mean={data.ci_completion_time.mean}
        />
        <CIBar
          label={data.ci_marks_difference.label}
          lower={data.ci_marks_difference.lower}
          upper={data.ci_marks_difference.upper}
          mean={data.ci_marks_difference.mean}
        />
      </div>

      {/* Overall conclusion */}
      <div style={{
        background: data.t_test.reject_null ? "rgba(251,191,36,0.06)" : "rgba(45,212,191,0.06)",
        border: `1px solid ${data.t_test.reject_null ? "rgba(251,191,36,0.2)" : "rgba(45,212,191,0.2)"}`,
        borderRadius: 10, padding: "1.25rem",
      }}>
        <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)", marginBottom: 8 }}>OVERALL CONCLUSION</div>
        <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.7, fontWeight: 500 }}>{data.overall_conclusion}</div>
      </div>
    </div>
  );
}
