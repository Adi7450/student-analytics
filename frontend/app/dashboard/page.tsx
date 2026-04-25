"use client";
import { useStats, useSolutions, useHypothesis, useProbability } from "@/lib/hooks/useData";
import { StatCard } from "@/components/StatCard";
import { SolutionsPanel } from "@/components/SolutionsPanel";
import { LoadingSkeleton, NoData, ErrorState, PageHeader, SectionLabel } from "@/components/ui";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function DashboardPage() {
  const stats  = useStats();
  const sol    = useSolutions();
  const hyp    = useHypothesis();
  const prob   = useProbability();

  const loading = stats.isLoading || sol.isLoading;
  const noData  = !stats.data && !stats.isLoading && !stats.error;

  if (noData) return <><PageHeader title="Dashboard" subtitle="Upload a CSV to begin" /><NoData /></>;
  if (loading) return <><PageHeader title="Dashboard" /><LoadingSkeleton rows={5} /></>;
  if (stats.error) return <ErrorState message={(stats.error as any).message} />;

  const s = stats.data!;
  const p = prob.data;
  const h = hyp.data;

  const groupData = [
    { name: "Early", marks: s.mean_marks_early, fill: "#2dd4bf" },
    { name: "Late",  marks: s.mean_marks_late,  fill: "#fb7185" },
  ];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <PageHeader
        title="Dashboard"
        subtitle={`Analysing ${s.sample_size} student responses — ${p ? (p.p_on_time * 100).toFixed(1) : "—"}% submitted on time`}
      />

      {/* KPI grid */}
      <SectionLabel>KEY METRICS</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
        <StatCard label="Mean marks"        value={s.mean_marks.toFixed(2)}           sub="out of 10"                  accent="amber" delay={0} />
        <StatCard label="On-time rate"      value={p ? `${(p.p_on_time*100).toFixed(1)}%` : "—"} sub="submitted before deadline" accent="teal"  delay={80} />
        <StatCard label="Pearson r"         value={s.pearson_r.toFixed(3)}            sub={s.correlation_interpretation.split(" ").slice(0,2).join(" ")} accent="coral" delay={160} />
        <StatCard label="Early avg marks"   value={s.mean_marks_early.toFixed(2)}     sub="on-time submitters"         accent="green" delay={240} />
        <StatCard label="Late avg marks"    value={s.mean_marks_late.toFixed(2)}      sub="late submitters"            accent="coral" delay={320} />
        <StatCard label="Sample size"       value={s.sample_size}                     sub="valid responses"            accent="teal"  delay={400} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        {/* Group comparison bar */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: 12, padding: "1.5rem" }}>
          <SectionLabel>MEAN MARKS: EARLY vs LATE</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={groupData} barSize={60}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#151d2e", border: "1px solid #1e2a3f", borderRadius: 8, fontFamily: "IBM Plex Mono", fontSize: 12 }}
                formatter={(v: number) => [v.toFixed(2), "Avg Marks"]}
              />
              <Bar dataKey="marks" radius={[6, 6, 0, 0]}>
                {groupData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick stats */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: 12, padding: "1.5rem" }}>
          <SectionLabel>DISTRIBUTION SNAPSHOT</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {[
              { label: "Mean completion time", value: `${s.mean_completion_time.toFixed(2)} days before deadline`, accent: "var(--accent-amber)" },
              { label: "Std dev completion",   value: `± ${s.std_completion_time.toFixed(2)} days`,               accent: "var(--accent-teal)" },
              { label: "Skewness",             value: `${s.skewness_completion_time.toFixed(3)} ${s.skewness_completion_time < -0.5 ? "(left-skewed ← late bias)" : s.skewness_completion_time > 0.5 ? "(right-skewed → early bias)" : "(approx. symmetric)"}`, accent: "var(--accent-coral)" },
              { label: "Kurtosis (excess)",    value: `${s.kurtosis_completion_time.toFixed(3)} ${s.kurtosis_completion_time > 2 ? "(fat tails)" : "(normal tails)"}`,  accent: "#a78bfa" },
              { label: "R² (regression)",      value: `${(s.regression.r_squared * 100).toFixed(1)}% variance explained`, accent: "#4ade80" },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--bg-border)", paddingBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 12, fontFamily: "IBM Plex Mono, monospace", color: accent, fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hypothesis quick verdict */}
      {h && (
        <div style={{
          marginBottom: 32,
          background: h.t_test.reject_null ? "rgba(251,113,133,0.06)" : "rgba(74,222,128,0.06)",
          border: `1px solid ${h.t_test.reject_null ? "rgba(251,113,133,0.2)" : "rgba(74,222,128,0.2)"}`,
          borderRadius: 12, padding: "1.25rem",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{ fontSize: 28 }}>{h.t_test.reject_null ? "⚠" : "✓"}</div>
          <div>
            <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)", marginBottom: 4 }}>HYPOTHESIS TEST VERDICT</div>
            <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{h.overall_conclusion}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, fontFamily: "IBM Plex Mono, monospace" }}>
              t = {h.t_test.t_statistic.toFixed(4)} · p = {h.t_test.p_value < 0.001 ? "< 0.001" : h.t_test.p_value.toFixed(4)} · α = 0.05
            </div>
          </div>
        </div>
      )}

      {/* Solutions */}
      <SectionLabel>SOLUTIONS & RECOMMENDATIONS</SectionLabel>
      {sol.isLoading ? <LoadingSkeleton rows={3} /> : sol.data ? <SolutionsPanel data={sol.data} /> : null}
    </div>
  );
}
