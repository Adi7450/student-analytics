"use client";
import { useState } from "react";
import { useSampling, useHypothesis } from "@/lib/hooks/useData";
import { LoadingSkeleton, NoData, ErrorState, PageHeader, SectionLabel, ChartCard } from "@/components/ui";
import { StatCard } from "@/components/StatCard";
import { HypothesisPanel } from "@/components/HypothesisPanel";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { CltSampleMean } from "@/lib/api";

// Build histogram from raw sample means array
function buildHistogram(means: number[], bins = 20) {
  if (!means.length) return [];
  const min = Math.min(...means);
  const max = Math.max(...means);
  const width = (max - min) / bins || 1;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    label: (min + i * width).toFixed(2),
    midpoint: min + (i + 0.5) * width,
    count: 0,
  }));
  means.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / width), bins - 1);
    buckets[idx].count++;
  });
  return buckets;
}

function CltChart({ sim }: { sim: CltSampleMean }) {
  const hist = buildHistogram(sim.sample_means);
  return (
    <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "1rem" }}>
      <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--accent-teal)", marginBottom: 4 }}>
        n = {sim.sample_size}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontFamily: "IBM Plex Mono, monospace" }}>
        μ̄ = {sim.mean_of_means.toFixed(3)} · σ̄ = {sim.std_of_means.toFixed(3)}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={hist} barSize={8}>
          <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} />
          <YAxis tick={false} axisLine={false} tickLine={false} width={0} />
          <Tooltip
            contentStyle={{ background: "#0f1624", border: "1px solid #1e2a3f", borderRadius: 6, fontFamily: "IBM Plex Mono", fontSize: 11 }}
            formatter={(v: number) => [v, "count"]}
            labelFormatter={(l: string) => `x̄ ≈ ${l}`}
          />
          <ReferenceLine
            x={hist.find(b => Math.abs(b.midpoint - sim.mean_of_means) === Math.min(...hist.map(b => Math.abs(b.midpoint - sim.mean_of_means))))?.label}
            stroke="var(--accent-amber)" strokeDasharray="3 2"
          />
          <Bar dataKey="count" fill="#2dd4bf" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function InferentialPage() {
  const sampling  = useSampling();
  const hypothesis = useHypothesis();
  const [activeTab, setActiveTab] = useState<"sampling" | "hypothesis">("sampling");

  const loading = sampling.isLoading || hypothesis.isLoading;
  const noData  = !sampling.data && !sampling.isLoading && !sampling.error;

  if (noData) return <><PageHeader title="Inferential Statistics" /><NoData /></>;
  if (loading) return <><PageHeader title="Inferential Statistics" /><LoadingSkeleton rows={5} /></>;
  if (sampling.error) return <ErrorState message={(sampling.error as any).message} />;

  const s = sampling.data!;
  const h = hypothesis.data;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <PageHeader title="Inferential Statistics" subtitle="Sampling theory, Central Limit Theorem, and hypothesis testing" />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["sampling", "hypothesis"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "6px 20px", borderRadius: 7, border: "none", cursor: "pointer",
              fontFamily: "IBM Plex Mono, monospace", fontSize: 12, letterSpacing: "0.3px",
              background: activeTab === tab ? "var(--accent-amber)" : "transparent",
              color: activeTab === tab ? "#0a0e1a" : "var(--text-muted)",
              fontWeight: activeTab === tab ? 600 : 400,
              transition: "all 0.15s ease",
            }}
          >
            {tab === "sampling" ? "Sampling Theory" : "Hypothesis Testing"}
          </button>
        ))}
      </div>

      {activeTab === "sampling" && (
        <>
          <SectionLabel>SAMPLING PARAMETERS</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 32 }}>
            <StatCard label="Population mean"   value={s.population_mean.toFixed(4)}    sub="days before deadline" accent="amber" delay={0} />
            <StatCard label="Population std"    value={`± ${s.population_std.toFixed(4)}`} sub="sample std dev"    accent="teal"  delay={80} />
            <StatCard label="Sample size (n)"   value={s.sample_size}                   sub="valid responses"      accent="coral" delay={160} />
            <StatCard label="Standard error"    value={s.standard_error.toFixed(4)}     sub="SE = σ / √n"          accent="green" delay={240} />
            <StatCard label="Margin of error"   value={`± ${s.margin_of_error_95.toFixed(4)}`} sub="95% (z=1.96)"  accent="amber" delay={320} />
          </div>

          {/* 95% CI bar */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: 12, padding: "1.5rem", marginBottom: 28 }}>
            <SectionLabel>95% CONFIDENCE INTERVAL FOR MEAN COMPLETION TIME</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "var(--text-muted)" }}>
                [{s.ci_lower_95.toFixed(4)}
              </div>
              <div style={{ flex: 1, minWidth: 200, position: "relative", height: 12 }}>
                <div style={{ position: "absolute", inset: "3px 0", background: "rgba(45,212,191,0.15)", borderRadius: 6, border: "1px solid rgba(45,212,191,0.3)" }} />
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 12, height: 12, background: "var(--accent-teal)", borderRadius: "50%", border: "2px solid #0a0e1a" }} />
              </div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "var(--text-muted)" }}>
                {s.ci_upper_95.toFixed(4)}]
              </div>
            </div>
            <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
              We are 95% confident the true mean completion time lies between&nbsp;
              <span style={{ fontFamily: "IBM Plex Mono, monospace", color: "var(--accent-teal)" }}>{s.ci_lower_95.toFixed(3)}</span>&nbsp;and&nbsp;
              <span style={{ fontFamily: "IBM Plex Mono, monospace", color: "var(--accent-teal)" }}>{s.ci_upper_95.toFixed(3)}</span>&nbsp;days before the deadline.
            </div>

            {/* Normality test */}
            <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: "0.75rem 1rem", flex: 1 }}>
                <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)" }}>SHAPIRO-WILK STATISTIC</div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 18, fontWeight: 600, color: "var(--accent-amber)" }}>{s.shapiro_statistic.toFixed(4)}</div>
              </div>
              <div style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: "0.75rem 1rem", flex: 1 }}>
                <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)" }}>p-VALUE</div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 18, fontWeight: 600, color: "var(--accent-amber)" }}>
                  {s.shapiro_p_value < 0.001 ? "< 0.001" : s.shapiro_p_value.toFixed(4)}
                </div>
              </div>
              <div style={{
                background: s.is_normal ? "rgba(74,222,128,0.08)" : "rgba(251,191,36,0.08)",
                border: `1px solid ${s.is_normal ? "rgba(74,222,128,0.25)" : "rgba(251,191,36,0.25)"}`,
                borderRadius: 8, padding: "0.75rem 1rem", flex: 1,
              }}>
                <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)" }}>NORMALITY</div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 15, fontWeight: 600, color: s.is_normal ? "#4ade80" : "#fbbf24" }}>
                  {s.is_normal ? "✓ Normal" : "✗ Non-normal"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {s.is_normal ? "CLT confirms normality" : "CLT still applies (large n)"}
                </div>
              </div>
            </div>
          </div>

          {/* CLT simulation */}
          <SectionLabel>CENTRAL LIMIT THEOREM SIMULATION (500 bootstrap samples each)</SectionLabel>
          <div style={{ marginBottom: 12, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            As sample size <em>n</em> increases, the distribution of sample means converges to a normal distribution
            centred on the population mean ({s.population_mean.toFixed(3)}), demonstrating the CLT.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 32 }}>
            {s.clt_simulation.map(sim => (
              <CltChart key={sim.sample_size} sim={sim} />
            ))}
          </div>

          {/* SE vs sample size insight */}
          <ChartCard title="Standard error decreases as sample size grows (SE = σ / √n)">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={s.clt_simulation.map(sim => ({
                  n: sim.sample_size,
                  se: parseFloat(sim.std_of_means.toFixed(4)),
                }))}
                barSize={40}
              >
                <CartesianGrid vertical={false} stroke="#1e2a3f" />
                <XAxis dataKey="n" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false}
                  label={{ value: "Sample size (n)", position: "insideBottom", offset: -2, fill: "#475569", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#151d2e", border: "1px solid #1e2a3f", borderRadius: 8, fontFamily: "IBM Plex Mono", fontSize: 12 }}
                  formatter={(v: number) => [v.toFixed(4), "Std Error of Means"]}
                />
                <Bar dataKey="se" fill="#a78bfa" fillOpacity={0.75} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}

      {activeTab === "hypothesis" && h && (
        <>
          <SectionLabel>HYPOTHESIS TESTING RESULTS</SectionLabel>
          <HypothesisPanel data={h} />
        </>
      )}
      {activeTab === "hypothesis" && !h && (
        <ErrorState message="Could not load hypothesis test data." />
      )}
    </div>
  );
}
