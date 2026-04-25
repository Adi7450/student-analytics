"""
probability_engine.py
Computes:
  - P(on-time) and P(late)
  - Conditional probability: P(delay | low/high study hours)
  - Bayes theorem: P(high marks | early submission)
  - Binomial distribution: modeling on-time vs late over N trials
  - Poisson distribution: expected late submissions per month
"""
import numpy as np
import pandas as pd
from scipy.stats import binom, poisson
from models.schemas import (
    ProbabilityResponse, BinomialPoint, PoissonPoint,
)
from typing import List


def _safe_div(num: float, denom: float) -> float:
    return float(num / denom) if denom > 0 else 0.0


def compute_probability(df: pd.DataFrame) -> ProbabilityResponse:
    n = len(df)

    # ── Basic probabilities ──────────────────────────────────────────────────
    n_on_time = int(df["submitted_on_time"].sum())
    n_late    = n - n_on_time
    p_on_time = _safe_div(n_on_time, n)
    p_late    = _safe_div(n_late, n)

    # ── Conditional probability: P(delay | study hours) ─────────────────────
    # Low study = below median hours_per_day_final_week
    median_study = df["hours_per_day_final_week"].median()
    low_study_mask  = df["hours_per_day_final_week"] < median_study
    high_study_mask = ~low_study_mask

    n_low_study  = int(low_study_mask.sum())
    n_high_study = int(high_study_mask.sum())

    late_and_low  = int((~df["submitted_on_time"] & low_study_mask).sum())
    late_and_high = int((~df["submitted_on_time"] & high_study_mask).sum())

    p_delay_given_low  = _safe_div(late_and_low,  n_low_study)
    p_delay_given_high = _safe_div(late_and_high, n_high_study)

    # ── Bayes theorem: P(high marks | early submission) ─────────────────────
    # Prior: P(high marks) based on dataset mean
    mean_marks = df["marks"].mean()
    high_marks_threshold = float(mean_marks)

    high_marks_mask = df["marks"] >= high_marks_threshold
    early_mask      = df["submitted_on_time"] == True

    n_high_marks = int(high_marks_mask.sum())
    n_early      = int(early_mask.sum())

    # P(high marks) = prior
    prior_high_marks = _safe_div(n_high_marks, n)

    # P(early | high marks) = likelihood
    early_and_high = int((early_mask & high_marks_mask).sum())
    likelihood_early_given_high = _safe_div(early_and_high, n_high_marks)

    # P(early) = marginal
    p_early = _safe_div(n_early, n)

    # Bayes: P(high | early) = P(early | high) * P(high) / P(early)
    if p_early > 0:
        p_high_given_early = (likelihood_early_given_high * prior_high_marks) / p_early
    else:
        p_high_given_early = 0.0

    # P(high marks | late) for comparison
    late_mask = ~early_mask
    n_late_group = int(late_mask.sum())
    late_and_high = int((late_mask & high_marks_mask).sum())
    p_high_given_late = _safe_div(late_and_high, n_late_group)

    # ── Binomial distribution ────────────────────────────────────────────────
    # Model: out of N students, k submit on time; p = observed p_on_time
    binom_n = min(n, 30)   # cap display at 30 for readability
    binom_p = p_on_time

    binomial_dist: List[BinomialPoint] = []
    cumulative = 0.0
    for k in range(binom_n + 1):
        pmf = float(binom.pmf(k, binom_n, binom_p))
        cumulative += pmf
        binomial_dist.append(BinomialPoint(
            k=k,
            probability=round(pmf, 6),
            cumulative=round(min(cumulative, 1.0), 6),
        ))

    # ── Poisson distribution ─────────────────────────────────────────────────
    # Lambda: expected late submissions per "month" (semester ÷ ~4 months)
    # We estimate using each student's personal late rate × total_assignments
    mean_lates_per_student = df["late_submissions"].dropna().mean()
    semester_months = 4
    poisson_lambda = float(mean_lates_per_student / semester_months)
    poisson_lambda = max(poisson_lambda, 0.01)   # avoid zero

    poisson_dist: List[PoissonPoint] = []
    for k in range(int(poisson_lambda * 4) + 6):
        pmf = float(poisson.pmf(k, poisson_lambda))
        if pmf < 1e-6 and k > poisson_lambda:
            break
        poisson_dist.append(PoissonPoint(k=k, probability=round(pmf, 6)))

    # ── Stress by group ──────────────────────────────────────────────────────
    mean_stress_on_time = float(df[df["submitted_on_time"] == True]["stress_level"].mean())
    mean_stress_late    = float(df[df["submitted_on_time"] == False]["stress_level"].mean())

    return ProbabilityResponse(
        p_on_time=round(p_on_time, 4),
        p_late=round(p_late, 4),

        p_delay_given_low_study=round(p_delay_given_low, 4),
        p_delay_given_high_study=round(p_delay_given_high, 4),
        low_study_threshold_hours=round(float(median_study), 2),

        p_high_marks_given_early=round(min(p_high_given_early, 1.0), 4),
        p_high_marks_given_late=round(p_high_given_late, 4),
        prior_high_marks=round(prior_high_marks, 4),
        likelihood_early_given_high=round(likelihood_early_given_high, 4),
        high_marks_threshold=round(high_marks_threshold, 2),

        binomial_n=binom_n,
        binomial_p=round(binom_p, 4),
        binomial_distribution=binomial_dist,

        poisson_lambda=round(poisson_lambda, 4),
        poisson_distribution=poisson_dist,

        mean_stress_on_time=round(mean_stress_on_time, 2),
        mean_stress_late=round(mean_stress_late, 2),
    )
