"use client";
import { useStats } from "@/lib/hooks/useData";
import { LoadingSkeleton, NoData, ErrorState, PageHeader, SectionLabel, ChartCard } from "@/components/ui";
import { StatCard } from "@/components/StatCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid, ReferenceLine, Line,
  ComposedChart,
} from "recharts";

const CustomScatterDot = (props: any) => {
  const { cx, cy, payload } = props;
  return (
    <circle
      cx={cx} cy={cy} r={5}
      fill={payload.on_time ? "#2dd4bf" : "#fb7185"}
      fillOpacity={0.7}
      stroke={payload.on_time ? "#2dd4bf" : "#fb7185"}
      strokeWidth={1}
    />
  );
};

export default function DescriptivePage() {
  const { data, isLoading, error } = useStats();

  if (!data && !isLoading && !error) return <><PageHeader title="Descriptive Statistics" /><NoData /></>;
  if (isLoading) return <><PageHeader title="Descriptive Statistics" /><LoadingSkeleton rows={4} /></>;
  if (error) return <ErrorState message={(error as any).message} />;

  const s = data!;

  // Build regression line overlay data
  const xMin = Math.min(...s.scatter_data.map(d => d.days_before_deadline));
  const xMax = Math.max(...s.scatter_data.map(d => d.days_before_deadline));
  const regLine = [
    { days: xMin, predicted: s.regression.slope * xMin + s.regression.intercept },
    { days: xMax, predicted: s.regression.slope * xMax + s.regression.intercept },
  ];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <PageHeader title="Descriptive Statistics" subtitle="Distributions, correlations, and regression model" />

      <SectionLabel>MARKS STATISTICS</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 32 }}>
        <StatCard label="Mean marks"     value={s.mean_marks.toFixed(3)}            accent="amber" />
        <StatCard label="Std deviation"  value={`± ${s.std_marks.toFixed(3)}`}      accent="teal"  />
        <StatCard label="Skewness"       value={s.skewness_marks.toFixed(3)}        sub={s.skewness_marks < 0 ? "left-skewed" : "right-skewed"} accent="coral" />
        <StatCard label="Kurtosis"       value={s.kurtosis_marks.toFixed(3)}        sub="excess kurtosis" accent="green" />
      </div>

      <SectionLabel>COMPLETION TIME STATISTICS</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 32 }}>
        <StatCard label="Mean days before" value={s.mean_completion_time.toFixed(3)}   accent="amber" />
        <StatCard label="Median"           value={s.median_completion_time.toFixed(3)} accent="teal"  />
        <StatCard label="Std deviation"    value={`± ${s.std_completion_time.toFixed(3)}`} accent="coral" />
        <StatCard label="Skewness"         value={s.skewness_completion_time.toFixed(3)} sub={s.skewness_completion_time < -0.5 ? "late-skewed" : "balanced"} accent="green" />
        <StatCard label="Kurtosis"         value={s.kurtosis_completion_time.toFixed(3)} sub="excess" accent="amber" />
      </div>

      {/* Histograms */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        <ChartCard title="Marks distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={s.marks_histogram} barSize={24}>
              <CartesianGrid vertical={false} stroke="#1e2a3f" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 9, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} interval={1} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#151d2e", border: "1px solid #1e2a3f", borderRadius: 8, fontFamily: "IBM Plex Mono", fontSize: 12 }}
                formatter={(v: number) => [v, "Count"]}
              />
              <Bar dataKey="count" fill="#fbbf24" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Completion time distribution (days before deadline)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={s.time_histogram} barSize={24}>
              <CartesianGrid vertical={false} stroke="#1e2a3f" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 9, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} interval={1} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#151d2e", border: "1px solid #1e2a3f", borderRadius: 8, fontFamily: "IBM Plex Mono", fontSize: 12 }}
                formatter={(v: number) => [v, "Count"]}
              />
              <Bar dataKey="count" fill="#2dd4bf" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Scatter plot */}
      <ChartCard title="Scatter plot: days before deadline vs marks (with regression line)" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
          <span style={{ color: "#2dd4bf" }}>● On-time</span>
          <span style={{ color: "#fb7185", marginLeft: 16 }}>● Late</span>
          <span style={{ color: "#fbbf24", marginLeft: 16 }}>— Regression line</span>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart>
            <CartesianGrid stroke="#1e2a3f" />
            <XAxis
              dataKey="days_before_deadline" type="number" name="Days before deadline"
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false}
              label={{ value: "Days before deadline", position: "insideBottom", offset: -4, fill: "#475569", fontSize: 11 }}
            />
            <YAxis
              dataKey="marks" type="number" domain={[0, 10]}
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false}
              label={{ value: "Marks /10", angle: -90, position: "insideLeft", offset: 10, fill: "#475569", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ background: "#151d2e", border: "1px solid #1e2a3f", borderRadius: 8, fontFamily: "IBM Plex Mono", fontSize: 12 }}
              formatter={(v: any, name: string) => [typeof v === "number" ? v.toFixed(2) : v, name]}
            />
            <Scatter
              data={s.scatter_data}
              shape={<CustomScatterDot />}
              name="Student"
            />
            <Line
              data={regLine} type="linear" dataKey="predicted"
              dot={false} stroke="#fbbf24" strokeWidth={2}
              strokeDasharray="6 3" name="Regression"
            />
            <ReferenceLine x={0} stroke="#1e2a3f" strokeDasharray="3 3" label={{ value: "Deadline", fill: "#475569", fontSize: 10 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Correlation & regression summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: 12, padding: "1.5rem" }}>
          <SectionLabel>CORRELATION COEFFICIENTS</SectionLabel>
          {[
            { label: "Pearson r",    value: s.pearson_r.toFixed(4),  p: s.pearson_p,  color: "var(--accent-amber)" },
            { label: "Spearman ρ",   value: s.spearman_r.toFixed(4), p: s.spearman_p, color: "var(--accent-teal)"  },
          ].map(({ label, value, p, color }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 12, fontFamily: "IBM Plex Mono, monospace", color, fontWeight: 600 }}>{value}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "IBM Plex Mono, monospace" }}>
                p = {p < 0.001 ? "< 0.001" : p.toFixed(4)} · {p < 0.05 ? "✓ significant" : "✗ not significant"}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)" }}>
            {s.correlation_interpretation}
          </div>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: 12, padding: "1.5rem" }}>
          <SectionLabel>LINEAR REGRESSION MODEL</SectionLabel>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "var(--accent-amber)", background: "var(--bg-elevated)", padding: "0.75rem 1rem", borderRadius: 8, marginBottom: 16 }}>
            {s.regression.equation}
          </div>
          {[
            { label: "Slope",      value: `${s.regression.slope.toFixed(4)} marks/day` },
            { label: "Intercept",  value: s.regression.intercept.toFixed(4) },
            { label: "R² score",   value: `${(s.regression.r_squared * 100).toFixed(2)}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--bg-border)" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
              <span style={{ fontSize: 12, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-primary)" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
