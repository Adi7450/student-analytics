"""
hypothesis_engine.py
Performs:
  - Independent samples t-test (early vs late marks)
  - Proportion z-test (% above-average marks: on-time vs late)
  - 95% Confidence Intervals:
      1. Mean completion time
      2. Difference in mean marks (early − late)
"""
import numpy as np
import pandas as pd
from scipy import stats as scipy_stats
from statsmodels.stats.proportion import proportions_ztest
from models.schemas import (
    HypothesisResponse, TTestResult, ProportionTestResult, ConfidenceInterval,
)


ALPHA = 0.05


def _ci_for_mean(values: np.ndarray, confidence: float = 0.95) -> tuple:
    """Return (lower, upper, mean) for a 1-sample t-interval."""
    n = len(values)
    mean = float(np.mean(values))
    se = float(scipy_stats.sem(values))
    t_crit = float(scipy_stats.t.ppf((1 + confidence) / 2, df=n - 1))
    margin = t_crit * se
    return mean - margin, mean + margin, mean


def compute_hypothesis(df: pd.DataFrame) -> HypothesisResponse:
    early = df[df["submitted_on_time"] == True]["marks"].dropna().values
    late  = df[df["submitted_on_time"] == False]["marks"].dropna().values

    # ── H₀ / H₁ ─────────────────────────────────────────────────────────────
    h0 = "H₀: Deadline submission timing has no effect on marks (μ_early = μ_late)."
    h1 = "H₁: Early submission significantly improves marks (μ_early > μ_late)."

    # ── Independent t-test ───────────────────────────────────────────────────
    if len(early) < 2 or len(late) < 2:
        t_stat, p_val = 0.0, 1.0
    else:
        t_stat, p_val = scipy_stats.ttest_ind(early, late, equal_var=False)  # Welch's t-test

    t_stat = float(t_stat)
    p_val  = float(p_val)
    reject_t = p_val < ALPHA

    if reject_t:
        interpretation_t = (
            f"Reject H₀ (p = {p_val:.4f} < {ALPHA}). "
            "There is statistically significant evidence that early submission "
            "leads to higher marks."
        )
    else:
        interpretation_t = (
            f"Fail to reject H₀ (p = {p_val:.4f} ≥ {ALPHA}). "
            "No statistically significant difference in marks between "
            "early and late submitters was detected."
        )

    # ── Proportion test ──────────────────────────────────────────────────────
    # Above-average marks = marks ≥ dataset mean
    mean_marks = float(df["marks"].mean())

    early_above = int((early >= mean_marks).sum())
    late_above  = int((late  >= mean_marks).sum())
    n_early     = len(early)
    n_late      = len(late)

    rate_early = float(early_above / n_early) if n_early > 0 else 0.0
    rate_late  = float(late_above  / n_late)  if n_late  > 0 else 0.0

    if n_early > 0 and n_late > 0:
        count_arr = np.array([early_above, late_above])
        nobs_arr  = np.array([n_early, n_late])
        z_stat, p_prop = proportions_ztest(count_arr, nobs_arr, alternative="larger")
        z_stat = float(z_stat)
        p_prop = float(p_prop)
    else:
        z_stat, p_prop = 0.0, 1.0

    reject_prop = p_prop < ALPHA
    if reject_prop:
        interpretation_prop = (
            f"Reject H₀ (p = {p_prop:.4f}). On-time students achieve above-average "
            f"marks at a significantly higher rate ({rate_early*100:.1f}% vs {rate_late*100:.1f}%)."
        )
    else:
        interpretation_prop = (
            f"Fail to reject H₀ (p = {p_prop:.4f}). No significant difference "
            f"in the proportion achieving above-average marks "
            f"({rate_early*100:.1f}% on-time vs {rate_late*100:.1f}% late)."
        )

    # ── Confidence intervals ─────────────────────────────────────────────────
    # 1. CI for mean completion time
    time_vals = df["days_before_deadline"].dropna().values
    ci_lo_time, ci_hi_time, mean_time = _ci_for_mean(time_vals)

    ci_completion = ConfidenceInterval(
        label="Mean completion time (days before deadline)",
        lower=round(ci_lo_time, 4),
        upper=round(ci_hi_time, 4),
        mean=round(mean_time, 4),
        confidence_level=0.95,
    )

    # 2. CI for difference in means (early − late)
    if len(early) >= 2 and len(late) >= 2:
        diff_mean = float(np.mean(early) - np.mean(late))
        se_diff = float(np.sqrt(
            np.var(early, ddof=1) / len(early) +
            np.var(late,  ddof=1) / len(late)
        ))
        # Welch–Satterthwaite df
        se_e2 = np.var(early, ddof=1) / len(early)
        se_l2 = np.var(late,  ddof=1) / len(late)
        df_ws = (se_e2 + se_l2) ** 2 / (
            se_e2 ** 2 / (len(early) - 1) + se_l2 ** 2 / (len(late) - 1)
        )
        t_crit = float(scipy_stats.t.ppf(0.975, df=df_ws))
        moe_diff = t_crit * se_diff
        ci_lo_diff = diff_mean - moe_diff
        ci_hi_diff = diff_mean + moe_diff
    else:
        diff_mean = ci_lo_diff = ci_hi_diff = 0.0

    ci_diff = ConfidenceInterval(
        label="Difference in mean marks (early − late submitters)",
        lower=round(ci_lo_diff, 4),
        upper=round(ci_hi_diff, 4),
        mean=round(diff_mean, 4),
        confidence_level=0.95,
    )

    # ── Overall conclusion ───────────────────────────────────────────────────
    if reject_t and reject_prop:
        conclusion = (
            "Both tests reject H₀. Strong statistical evidence that submitting "
            "before the deadline is associated with meaningfully higher academic performance."
        )
    elif reject_t or reject_prop:
        conclusion = (
            "Partial evidence against H₀. One test shows a significant effect; "
            "interpret results with caution given sample size."
        )
    else:
        conclusion = (
            "Neither test rejects H₀ at α = 0.05. The dataset does not provide "
            "sufficient evidence to conclude that submission timing affects marks."
        )

    return HypothesisResponse(
        h0=h0,
        h1=h1,
        t_test=TTestResult(
            t_statistic=round(t_stat, 4),
            p_value=round(p_val, 6),
            reject_null=reject_t,
            interpretation=interpretation_t,
            early_group_mean=round(float(np.mean(early)), 3) if len(early) else 0.0,
            late_group_mean=round(float(np.mean(late)),  3) if len(late)  else 0.0,
            early_group_n=n_early,
            late_group_n=n_late,
        ),
        proportion_test=ProportionTestResult(
            on_time_above_avg_rate=round(rate_early, 4),
            late_above_avg_rate=round(rate_late, 4),
            z_statistic=round(z_stat, 4),
            p_value=round(p_prop, 6),
            reject_null=reject_prop,
            interpretation=interpretation_prop,
        ),
        ci_completion_time=ci_completion,
        ci_marks_difference=ci_diff,
        overall_conclusion=conclusion,
    )
