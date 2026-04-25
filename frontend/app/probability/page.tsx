"use client";
import { useProbability } from "@/lib/hooks/useData";
import { LoadingSkeleton, NoData, ErrorState, PageHeader, SectionLabel, ChartCard } from "@/components/ui";
import { StatCard } from "@/components/StatCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, ReferenceLine,
} from "recharts";

function ProbabilityMeter({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontSize: 13, fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, background: "var(--bg-border)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value * 100}%`, background: color, borderRadius: 3, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

function BayesMatrix({ data }: { data: any }) {
  const cells = [
    { label: "P(high marks | early)", value: data.p_high_marks_given_early, color: "#2dd4bf" },
    { label: "P(high marks | late)",  value: data.p_high_marks_given_late,  color: "#fb7185" },
    { label: "P(high marks) prior",   value: data.prior_high_marks,         color: "#fbbf24" },
    { label: "P(early | high marks)", value: data.likelihood_early_given_high, color: "#a78bfa" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {cells.map(({ label, value, color }) => (
        <div key={label} style={{
          background: "var(--bg-elevated)", border: `1px solid ${color}30`,
          borderRadius: 10, padding: "1rem", textAlign: "center",
        }}>
          <div style={{ fontSize: 28, fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color }}>{(value * 100).toFixed(1)}%</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function ProbabilityPage() {
  const { data, isLoading, error } = useProbability();

  if (!data && !isLoading && !error) return <><PageHeader title="Probability & Distributions" /><NoData /></>;
  if (isLoading) return <><PageHeader title="Probability & Distributions" /><LoadingSkeleton rows={5} /></>;
  if (error) return <ErrorState message={(error as any).message} />;

  const p = data!;

  // Slice binomial data for chart readability
  const binomialData = p.binomial_distribution.filter(d =>
    d.probability > 0.001 || d.k === Math.round(p.binomial_n * p.binomial_p)
  );

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <PageHeader title="Probability & Distributions" subtitle="Bayesian analysis, conditional probabilities, and distribution modelling" />

      {/* Basic probabilities */}
      <SectionLabel>SUBMISSION PROBABILITIES</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 32 }}>
        <StatCard label="P(on-time)"           value={`${(p.p_on_time * 100).toFixed(1)}%`}  accent="teal"  />
        <StatCard label="P(late)"              value={`${(p.p_late * 100).toFixed(1)}%`}      accent="coral" />
        <StatCard label="Stress — on-time"     value={`${p.mean_stress_on_time.toFixed(2)}/5`} accent="green" />
        <StatCard label="Stress — late"        value={`${p.mean_stress_late.toFixed(2)}/5`}    accent="amber" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        {/* Conditional probability */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: 12, padding: "1.5rem" }}>
          <SectionLabel>CONDITIONAL PROBABILITY: P(DELAY | STUDY HOURS)</SectionLabel>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Low study threshold: <span style={{ fontFamily: "IBM Plex Mono, monospace", color: "var(--accent-amber)" }}>&lt; {p.low_study_threshold_hours} hrs/day</span>
          </div>
          <ProbabilityMeter
            value={p.p_delay_given_low_study}
            label="P(delay | low study hours)"
            color="#fb7185"
          />
          <ProbabilityMeter
            value={p.p_delay_given_high_study}
            label="P(delay | high study hours)"
            color="#2dd4bf"
          />
          <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "IBM Plex Mono, monospace" }}>DIFFERENCE</div>
            <div style={{ fontSize: 20, fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: "var(--accent-amber)", marginTop: 2 }}>
              {((p.p_delay_given_low_study - p.p_delay_given_high_study) * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              higher delay probability for low-study students
            </div>
          </div>
        </div>

        {/* Bayes theorem */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: 12, padding: "1.5rem" }}>
          <SectionLabel>BAYES' THEOREM — HIGH MARKS ANALYSIS</SectionLabel>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            High marks threshold: <span style={{ fontFamily: "IBM Plex Mono, monospace", color: "var(--accent-amber)" }}>≥ {p.high_marks_threshold.toFixed(1)} / 10</span>
          </div>
          <BayesMatrix data={p} />
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)" }}>BAYES FORMULA</div>
            <div style={{ fontSize: 12, fontFamily: "IBM Plex Mono, monospace", color: "var(--accent-amber)", marginTop: 4 }}>
              P(H|E) = P(E|H) × P(H) / P(E)
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              = {(p.likelihood_early_given_high * 100).toFixed(1)}% × {(p.prior_high_marks * 100).toFixed(1)}% / {(p.p_on_time * 100).toFixed(1)}%
              &nbsp;= <strong style={{ color: "var(--accent-teal)" }}>{(p.p_high_marks_given_early * 100).toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Binomial distribution */}
      <ChartCard title={`Binomial distribution — n=${p.binomial_n} students, p(on-time)=${(p.binomial_p * 100).toFixed(1)}%`} style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
          Probability of exactly <em>k</em> students submitting on time out of {p.binomial_n}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={binomialData} barSize={14}>
            <CartesianGrid vertical={false} stroke="#1e2a3f" />
            <XAxis
              dataKey="k"
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false} tickLine={false}
              label={{ value: "k (students on time)", position: "insideBottom", offset: -2, fill: "#475569", fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false} tickLine={false}
              tickFormatter={(v: number) => v.toFixed(3)}
            />
            <Tooltip
              contentStyle={{ background: "#151d2e", border: "1px solid #1e2a3f", borderRadius: 8, fontFamily: "IBM Plex Mono", fontSize: 12 }}
              formatter={(v: number) => [v.toFixed(5), "P(X = k)"]}
            />
            <ReferenceLine
              x={Math.round(p.binomial_n * p.binomial_p)}
              stroke="var(--accent-amber)" strokeDasharray="4 2"
              label={{ value: `μ=${(p.binomial_n * p.binomial_p).toFixed(1)}`, fill: "#fbbf24", fontSize: 10 }}
            />
            <Bar dataKey="probability" fill="#2dd4bf" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Poisson distribution */}
      <ChartCard title={`Poisson distribution — λ=${p.poisson_lambda.toFixed(3)} expected late submissions/month`}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
          Probability of exactly <em>k</em> late submissions occurring in a given month
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={p.poisson_distribution}>
            <CartesianGrid stroke="#1e2a3f" />
            <XAxis
              dataKey="k"
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false} tickLine={false}
              label={{ value: "k (late submissions)", position: "insideBottom", offset: -2, fill: "#475569", fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false} tickLine={false}
              tickFormatter={(v: number) => v.toFixed(3)}
            />
            <Tooltip
              contentStyle={{ background: "#151d2e", border: "1px solid #1e2a3f", borderRadius: 8, fontFamily: "IBM Plex Mono", fontSize: 12 }}
              formatter={(v: number) => [v.toFixed(5), "P(X = k)"]}
            />
            <ReferenceLine
              x={Math.round(p.poisson_lambda)}
              stroke="var(--accent-amber)" strokeDasharray="4 2"
              label={{ value: `λ=${p.poisson_lambda.toFixed(2)}`, fill: "#fbbf24", fontSize: 10 }}
            />
            <Line
              type="monotone" dataKey="probability"
              stroke="#fb7185" strokeWidth={2.5}
              dot={{ fill: "#fb7185", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#fb7185" }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 12, display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { label: "λ (expected lates/month)", value: p.poisson_lambda.toFixed(3), color: "var(--accent-amber)" },
            { label: "P(0 late this month)",     value: `${(p.poisson_distribution[0]?.probability * 100 || 0).toFixed(1)}%`, color: "#4ade80" },
            { label: "P(≥1 late this month)",    value: `${((1 - (p.poisson_distribution[0]?.probability || 0)) * 100).toFixed(1)}%`, color: "#fb7185" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: "var(--text-muted)" }}>{label}</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 16, fontWeight: 600, color }}>{value}</div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
