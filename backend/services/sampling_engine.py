"""
sampling_engine.py
Sampling theory:
  - Standard Error and Margin of Error for mean completion time
  - 95% Confidence Interval for mean completion time
  - Central Limit Theorem simulation (sample means across growing n)
  - Shapiro-Wilk normality test
"""
import numpy as np
import pandas as pd
from scipy import stats as scipy_stats
from models.schemas import SamplingResponse, CltSampleMean
from typing import List


def compute_sampling(df: pd.DataFrame) -> SamplingResponse:
    time_series = df["days_before_deadline"].dropna().values
    n = len(time_series)

    pop_mean = float(np.mean(time_series))
    pop_std  = float(np.std(time_series, ddof=1))   # sample std

    # ── Standard Error ───────────────────────────────────────────────────────
    se = float(pop_std / np.sqrt(n))

    # ── Margin of Error (95%, z = 1.96) ─────────────────────────────────────
    z_95 = 1.96
    moe_95 = float(z_95 * se)

    # ── 95% Confidence Interval ──────────────────────────────────────────────
    ci_lower = pop_mean - moe_95
    ci_upper = pop_mean + moe_95

    # ── CLT Simulation ───────────────────────────────────────────────────────
    # For sample sizes [5, 10, 15, 20, 30], draw 500 bootstrap samples each.
    # Return sample-mean distributions to show CLT convergence.
    np.random.seed(42)
    clt_sizes = [5, 10, 15, 20, 30]
    clt_results: List[CltSampleMean] = []

    for s in clt_sizes:
        if s > n:
            # Can't draw samples larger than dataset without replacement; skip
            continue
        sample_means = [
            float(np.mean(np.random.choice(time_series, size=s, replace=True)))
            for _ in range(500)
        ]
        clt_results.append(CltSampleMean(
            sample_size=s,
            sample_means=[round(m, 3) for m in sample_means],
            mean_of_means=round(float(np.mean(sample_means)), 4),
            std_of_means=round(float(np.std(sample_means)), 4),
        ))

    # ── Shapiro-Wilk normality test ──────────────────────────────────────────
    # Only valid for n ≤ 5000; use first 500 if larger
    test_data = time_series[:500] if n > 500 else time_series
    shapiro_stat, shapiro_p = scipy_stats.shapiro(test_data)

    return SamplingResponse(
        population_mean=round(pop_mean, 4),
        population_std=round(pop_std, 4),
        sample_size=n,

        standard_error=round(se, 4),
        margin_of_error_95=round(moe_95, 4),

        ci_lower_95=round(ci_lower, 4),
        ci_upper_95=round(ci_upper, 4),

        clt_simulation=clt_results,

        shapiro_statistic=round(float(shapiro_stat), 4),
        shapiro_p_value=round(float(shapiro_p), 6),
        is_normal=bool(shapiro_p > 0.05),
    )
