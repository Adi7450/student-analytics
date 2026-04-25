from pydantic import BaseModel
from typing import List, Optional, Dict, Any


# ── Upload ────────────────────────────────────────────────────────────────────
class UploadResponse(BaseModel):
    message: str
    rows: int
    columns: List[str]
    on_time_count: int
    late_count: int


# ── Statistics ────────────────────────────────────────────────────────────────
class ScatterPoint(BaseModel):
    days_before_deadline: float
    marks: float
    on_time: bool


class RegressionResult(BaseModel):
    slope: float
    intercept: float
    r_squared: float
    equation: str


class StatsResponse(BaseModel):
    # Completion time (days_before_deadline)
    mean_completion_time: float
    median_completion_time: float
    std_completion_time: float
    skewness_completion_time: float
    kurtosis_completion_time: float

    # Marks
    mean_marks: float
    std_marks: float
    skewness_marks: float
    kurtosis_marks: float

    # Correlation
    pearson_r: float
    pearson_p: float
    spearman_r: float
    spearman_p: float
    correlation_interpretation: str

    # Regression
    regression: RegressionResult

    # Scatter data
    scatter_data: List[ScatterPoint]

    # Marks distribution histogram buckets
    marks_histogram: List[Dict[str, Any]]

    # Completion time histogram
    time_histogram: List[Dict[str, Any]]

    # Group means
    mean_marks_early: float
    mean_marks_late: float
    sample_size: int


# ── Probability ───────────────────────────────────────────────────────────────
class BinomialPoint(BaseModel):
    k: int
    probability: float
    cumulative: float


class PoissonPoint(BaseModel):
    k: int
    probability: float


class ProbabilityResponse(BaseModel):
    # Basic probabilities
    p_on_time: float
    p_late: float

    # Conditional probabilities
    p_delay_given_low_study: float
    p_delay_given_high_study: float
    low_study_threshold_hours: float

    # Bayes theorem
    p_high_marks_given_early: float
    p_high_marks_given_late: float
    prior_high_marks: float
    likelihood_early_given_high: float
    high_marks_threshold: float

    # Binomial distribution data
    binomial_n: int
    binomial_p: float
    binomial_distribution: List[BinomialPoint]

    # Poisson distribution data
    poisson_lambda: float
    poisson_distribution: List[PoissonPoint]

    # Stress correlation
    mean_stress_on_time: float
    mean_stress_late: float


# ── Sampling ──────────────────────────────────────────────────────────────────
class CltSampleMean(BaseModel):
    sample_size: int
    sample_means: List[float]
    mean_of_means: float
    std_of_means: float


class SamplingResponse(BaseModel):
    population_mean: float
    population_std: float
    sample_size: int

    standard_error: float
    margin_of_error_95: float

    ci_lower_95: float
    ci_upper_95: float

    # CLT simulation across different sample sizes
    clt_simulation: List[CltSampleMean]

    # Normality test
    shapiro_statistic: float
    shapiro_p_value: float
    is_normal: bool


# ── Hypothesis ────────────────────────────────────────────────────────────────
class TTestResult(BaseModel):
    t_statistic: float
    p_value: float
    reject_null: bool
    interpretation: str
    early_group_mean: float
    late_group_mean: float
    early_group_n: int
    late_group_n: int


class ProportionTestResult(BaseModel):
    on_time_above_avg_rate: float
    late_above_avg_rate: float
    z_statistic: float
    p_value: float
    reject_null: bool
    interpretation: str


class ConfidenceInterval(BaseModel):
    label: str
    lower: float
    upper: float
    mean: float
    confidence_level: float


class HypothesisResponse(BaseModel):
    # Null / alternate hypothesis text
    h0: str
    h1: str

    # Independent t-test
    t_test: TTestResult

    # Proportion test
    proportion_test: ProportionTestResult

    # Confidence intervals
    ci_completion_time: ConfidenceInterval
    ci_marks_difference: ConfidenceInterval

    # Overall verdict
    overall_conclusion: str


# ── Solutions ─────────────────────────────────────────────────────────────────
class Recommendation(BaseModel):
    severity: str          # "alert" | "warning" | "info" | "success"
    title: str
    detail: str
    metric_trigger: str    # which stat triggered this
    projected_improvement: Optional[str] = None


class SolutionsResponse(BaseModel):
    overall_health: str    # "at-risk" | "concerning" | "moderate" | "good"
    health_score: float    # 0-100
    recommendations: List[Recommendation]
    summary: str
