import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 30000,
});

// ── Types (mirror backend Pydantic schemas) ───────────────────────────────────

export interface UploadResponse {
  message: string;
  rows: number;
  columns: string[];
  on_time_count: number;
  late_count: number;
}

export interface ScatterPoint {
  days_before_deadline: number;
  marks: number;
  on_time: boolean;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r_squared: number;
  equation: string;
}

export interface StatsResponse {
  mean_completion_time: number;
  median_completion_time: number;
  std_completion_time: number;
  skewness_completion_time: number;
  kurtosis_completion_time: number;
  mean_marks: number;
  std_marks: number;
  skewness_marks: number;
  kurtosis_marks: number;
  pearson_r: number;
  pearson_p: number;
  spearman_r: number;
  spearman_p: number;
  correlation_interpretation: string;
  regression: RegressionResult;
  scatter_data: ScatterPoint[];
  marks_histogram: { label: string; count: number; frequency: number }[];
  time_histogram:  { label: string; count: number; frequency: number }[];
  mean_marks_early: number;
  mean_marks_late: number;
  sample_size: number;
}

export interface BinomialPoint { k: number; probability: number; cumulative: number; }
export interface PoissonPoint  { k: number; probability: number; }

export interface ProbabilityResponse {
  p_on_time: number;
  p_late: number;
  p_delay_given_low_study: number;
  p_delay_given_high_study: number;
  low_study_threshold_hours: number;
  p_high_marks_given_early: number;
  p_high_marks_given_late: number;
  prior_high_marks: number;
  likelihood_early_given_high: number;
  high_marks_threshold: number;
  binomial_n: number;
  binomial_p: number;
  binomial_distribution: BinomialPoint[];
  poisson_lambda: number;
  poisson_distribution: PoissonPoint[];
  mean_stress_on_time: number;
  mean_stress_late: number;
}

export interface CltSampleMean {
  sample_size: number;
  sample_means: number[];
  mean_of_means: number;
  std_of_means: number;
}

export interface SamplingResponse {
  population_mean: number;
  population_std: number;
  sample_size: number;
  standard_error: number;
  margin_of_error_95: number;
  ci_lower_95: number;
  ci_upper_95: number;
  clt_simulation: CltSampleMean[];
  shapiro_statistic: number;
  shapiro_p_value: number;
  is_normal: boolean;
}

export interface TTestResult {
  t_statistic: number;
  p_value: number;
  reject_null: boolean;
  interpretation: string;
  early_group_mean: number;
  late_group_mean: number;
  early_group_n: number;
  late_group_n: number;
}

export interface ProportionTestResult {
  on_time_above_avg_rate: number;
  late_above_avg_rate: number;
  z_statistic: number;
  p_value: number;
  reject_null: boolean;
  interpretation: string;
}

export interface ConfidenceInterval {
  label: string;
  lower: number;
  upper: number;
  mean: number;
  confidence_level: number;
}

export interface HypothesisResponse {
  h0: string;
  h1: string;
  t_test: TTestResult;
  proportion_test: ProportionTestResult;
  ci_completion_time: ConfidenceInterval;
  ci_marks_difference: ConfidenceInterval;
  overall_conclusion: string;
}

export interface Recommendation {
  severity: "alert" | "warning" | "info" | "success";
  title: string;
  detail: string;
  metric_trigger: string;
  projected_improvement?: string;
}

export interface SolutionsResponse {
  overall_health: "at-risk" | "concerning" | "moderate" | "good";
  health_score: number;
  recommendations: Recommendation[];
  summary: string;
}

// ── API fetch functions ───────────────────────────────────────────────────────

export const uploadCsv = async (file: File): Promise<UploadResponse> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<UploadResponse>("/api/upload", form);
  return data;
};

export const fetchStats       = async (): Promise<StatsResponse>       => (await api.get("/api/stats")).data;
export const fetchProbability = async (): Promise<ProbabilityResponse> => (await api.get("/api/probability")).data;
export const fetchSampling    = async (): Promise<SamplingResponse>    => (await api.get("/api/sampling")).data;
export const fetchHypothesis  = async (): Promise<HypothesisResponse>  => (await api.get("/api/hypothesis")).data;
export const fetchSolutions   = async (): Promise<SolutionsResponse>   => (await api.get("/api/solutions")).data;
