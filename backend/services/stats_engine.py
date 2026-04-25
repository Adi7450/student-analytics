"""
stats_engine.py
Computes all descriptive statistics, correlation coefficients,
linear regression, and chart-ready data for the frontend.
"""
import numpy as np
import pandas as pd
from scipy import stats as scipy_stats
from sklearn.linear_model import LinearRegression
from models.schemas import (
    StatsResponse, ScatterPoint, RegressionResult,
)
from typing import List, Dict, Any


def _histogram_buckets(series: pd.Series, bins: int = 8) -> List[Dict[str, Any]]:
    """Return list of {label, count, frequency} dicts for a Recharts bar chart."""
    counts, edges = np.histogram(series.dropna(), bins=bins)
    buckets = []
    for i, count in enumerate(counts):
        label = f"{edges[i]:.1f}–{edges[i+1]:.1f}"
        buckets.append({
            "label": label,
            "count": int(count),
            "frequency": round(float(count / len(series)), 4),
        })
    return buckets


def _interpret_correlation(r: float) -> str:
    abs_r = abs(r)
    direction = "positive" if r >= 0 else "negative"
    if abs_r >= 0.7:
        strength = "strong"
    elif abs_r >= 0.4:
        strength = "moderate"
    elif abs_r >= 0.2:
        strength = "weak"
    else:
        strength = "negligible"
    return f"{strength.capitalize()} {direction} correlation (r = {r:.3f})"


def compute_stats(df: pd.DataFrame) -> StatsResponse:
    time_col = df["days_before_deadline"].dropna()
    marks_col = df["marks"].dropna()

    # Align both series on common index for correlation/regression
    aligned = df[["days_before_deadline", "marks"]].dropna()
    X = aligned["days_before_deadline"].values
    Y = aligned["marks"].values

    # ── Descriptive: completion time ─────────────────────────────────────────
    mean_time = float(time_col.mean())
    median_time = float(time_col.median())
    std_time = float(time_col.std())
    skew_time = float(scipy_stats.skew(time_col))
    kurt_time = float(scipy_stats.kurtosis(time_col))   # excess kurtosis

    # ── Descriptive: marks ───────────────────────────────────────────────────
    mean_marks = float(marks_col.mean())
    std_marks = float(marks_col.std())
    skew_marks = float(scipy_stats.skew(marks_col))
    kurt_marks = float(scipy_stats.kurtosis(marks_col))

    # ── Correlation ──────────────────────────────────────────────────────────
    pearson_r, pearson_p = scipy_stats.pearsonr(X, Y)
    spearman_r, spearman_p = scipy_stats.spearmanr(X, Y)

    # ── Linear Regression ────────────────────────────────────────────────────
    reg = LinearRegression()
    reg.fit(X.reshape(-1, 1), Y)
    slope = float(reg.coef_[0])
    intercept = float(reg.intercept_)
    r_squared = float(reg.score(X.reshape(-1, 1), Y))
    equation = (
        f"marks = {slope:.3f} × days_before_deadline "
        f"{'+ ' if intercept >= 0 else '- '}{abs(intercept):.3f}"
    )

    # ── Scatter data ─────────────────────────────────────────────────────────
    scatter = [
        ScatterPoint(
            days_before_deadline=float(row["days_before_deadline"]),
            marks=float(row["marks"]),
            on_time=bool(row["submitted_on_time"]),
        )
        for _, row in df[["days_before_deadline", "marks", "submitted_on_time"]].dropna().iterrows()
    ]

    # ── Group means ──────────────────────────────────────────────────────────
    early_df = df[df["submitted_on_time"] == True]["marks"]
    late_df  = df[df["submitted_on_time"] == False]["marks"]
    mean_marks_early = float(early_df.mean()) if len(early_df) > 0 else 0.0
    mean_marks_late  = float(late_df.mean())  if len(late_df)  > 0 else 0.0

    return StatsResponse(
        mean_completion_time=round(mean_time, 3),
        median_completion_time=round(median_time, 3),
        std_completion_time=round(std_time, 3),
        skewness_completion_time=round(skew_time, 3),
        kurtosis_completion_time=round(kurt_time, 3),

        mean_marks=round(mean_marks, 3),
        std_marks=round(std_marks, 3),
        skewness_marks=round(skew_marks, 3),
        kurtosis_marks=round(kurt_marks, 3),

        pearson_r=round(float(pearson_r), 4),
        pearson_p=round(float(pearson_p), 6),
        spearman_r=round(float(spearman_r), 4),
        spearman_p=round(float(spearman_p), 6),
        correlation_interpretation=_interpret_correlation(float(pearson_r)),

        regression=RegressionResult(
            slope=round(slope, 4),
            intercept=round(intercept, 4),
            r_squared=round(r_squared, 4),
            equation=equation,
        ),

        scatter_data=scatter,
        marks_histogram=_histogram_buckets(marks_col, bins=9),
        time_histogram=_histogram_buckets(time_col, bins=10),

        mean_marks_early=round(mean_marks_early, 3),
        mean_marks_late=round(mean_marks_late, 3),
        sample_size=len(df),
    )
