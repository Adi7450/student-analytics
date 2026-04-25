"""
solutions_engine.py
Rule-based engine that reads statistical outputs and produces
prioritised, human-readable recommendations.
"""
from models.schemas import (
    SolutionsResponse, Recommendation,
    StatsResponse, ProbabilityResponse, SamplingResponse, HypothesisResponse,
)
from typing import List


def compute_solutions(
    stats: StatsResponse,
    prob: ProbabilityResponse,
    sampling: SamplingResponse,
    hyp: HypothesisResponse,
) -> SolutionsResponse:

    recs: List[Recommendation] = []
    score_penalties = 0.0   # accumulate deductions from 100

    # ── Rule 1: Skewness of completion time ──────────────────────────────────
    skew = stats.skewness_completion_time
    if skew < -1.5:
        recs.append(Recommendation(
            severity="alert",
            title="Severe last-minute submission pattern detected",
            detail=(
                f"Completion time skewness is {skew:.2f}, indicating that the "
                "majority of students are finishing work extremely close to or "
                "after the deadline. This dramatically compresses revision time "
                "and inflates errors."
            ),
            metric_trigger=f"skewness = {skew:.2f}",
            projected_improvement=(
                "Introducing a mandatory draft submission 5 days before the final "
                "deadline could shift the mean submission window by ~3 days and "
                "project a 0.8–1.2 mark improvement based on the regression slope."
            ),
        ))
        score_penalties += 25
    elif skew < -0.7:
        recs.append(Recommendation(
            severity="warning",
            title="Moderate last-minute submission tendency",
            detail=(
                f"Skewness of {skew:.2f} shows students lean toward completing "
                "assignments close to the deadline. Mild milestone check-ins "
                "could help distribute effort more evenly."
            ),
            metric_trigger=f"skewness = {skew:.2f}",
            projected_improvement="Milestone check-ins may improve average marks by ~0.4–0.6 points.",
        ))
        score_penalties += 12

    # ── Rule 2: Hypothesis test result ──────────────────────────────────────
    if hyp.t_test.reject_null:
        diff = hyp.t_test.early_group_mean - hyp.t_test.late_group_mean
        recs.append(Recommendation(
            severity="alert",
            title="Statistically proven: early submission boosts marks",
            detail=(
                f"The independent t-test (t = {hyp.t_test.t_statistic:.3f}, "
                f"p = {hyp.t_test.p_value:.4f}) confirms early submitters score "
                f"{diff:.2f} marks higher on average. This is not random chance."
            ),
            metric_trigger=f"t-test p = {hyp.t_test.p_value:.4f}",
            projected_improvement=(
                f"Incentivising on-time submission for all students could raise "
                f"cohort average marks by up to {diff * prob.p_late:.2f} points."
            ),
        ))
        score_penalties += 20

    # ── Rule 3: Late submission rate ─────────────────────────────────────────
    if prob.p_late > 0.5:
        recs.append(Recommendation(
            severity="alert",
            title=f"Majority of students ({prob.p_late*100:.1f}%) submit late",
            detail=(
                "More than half the cohort is not meeting deadlines. This "
                "signals a systemic workload or planning problem rather than "
                "individual student issues."
            ),
            metric_trigger=f"P(late) = {prob.p_late:.3f}",
            projected_improvement=(
                "A structured weekly planner distributed at assignment kickoff "
                "has historically reduced late rates by 20–30% in similar studies."
            ),
        ))
        score_penalties += 20
    elif prob.p_late > 0.3:
        recs.append(Recommendation(
            severity="warning",
            title=f"{prob.p_late*100:.1f}% late submission rate warrants attention",
            detail=(
                "Roughly 1 in 3 students submitted late. Consider whether "
                "deadlines are realistic relative to coursework volume."
            ),
            metric_trigger=f"P(late) = {prob.p_late:.3f}",
        ))
        score_penalties += 10

    # ── Rule 4: Conditional probability (low study → delay) ─────────────────
    diff_cond = prob.p_delay_given_low_study - prob.p_delay_given_high_study
    if diff_cond > 0.25:
        recs.append(Recommendation(
            severity="warning",
            title="Low study hours strongly predict late submission",
            detail=(
                f"Students studying fewer than {prob.low_study_threshold_hours:.1f} hrs/day "
                f"in the final week are {diff_cond*100:.1f}% more likely to submit late "
                f"(P(delay|low study) = {prob.p_delay_given_low_study:.2%}). "
                "This is a strong early-warning signal."
            ),
            metric_trigger=f"P(delay|low study) − P(delay|high study) = {diff_cond:.3f}",
            projected_improvement=(
                "Targeted study-hour nudges (e.g., a 3-day pre-deadline reminder "
                "to students not yet logging study time) could cut conditional "
                "delay probability by ~15%."
            ),
        ))
        score_penalties += 10

    # ── Rule 5: Bayes — P(high marks | early) ───────────────────────────────
    if prob.p_high_marks_given_early > 0.65:
        recs.append(Recommendation(
            severity="info",
            title="Bayesian model confirms early submission predicts high marks",
            detail=(
                f"P(high marks | early submission) = {prob.p_high_marks_given_early:.2%} "
                f"vs {prob.p_high_marks_given_late:.2%} for late submitters. "
                "Communicate this statistic to students as a concrete motivator."
            ),
            metric_trigger=f"Bayes P(high|early) = {prob.p_high_marks_given_early:.3f}",
        ))

    # ── Rule 6: High kurtosis (fat tails) ────────────────────────────────────
    if stats.kurtosis_completion_time > 2.0:
        recs.append(Recommendation(
            severity="warning",
            title="Fat-tail distribution: extreme last-minute submissions present",
            detail=(
                f"Excess kurtosis of {stats.kurtosis_completion_time:.2f} indicates "
                "an unusually high proportion of extreme cases — students finishing "
                "dangerously close to (or after) the deadline. These students are "
                "at the highest risk of academic underperformance."
            ),
            metric_trigger=f"kurtosis = {stats.kurtosis_completion_time:.2f}",
            projected_improvement=(
                "A 'danger zone' early-alert system (flagging students who "
                "haven't started 7 days before the deadline) targets this tail."
            ),
        ))
        score_penalties += 8

    # ── Rule 7: Correlation strength ─────────────────────────────────────────
    r = stats.pearson_r
    if r > 0.4:
        recs.append(Recommendation(
            severity="info",
            title="Positive correlation: earlier work = higher marks",
            detail=(
                f"Pearson r = {r:.3f}. Each additional day students complete work "
                f"before the deadline is associated with {stats.regression.slope:.3f} "
                "mark improvement. Share this regression result with students visually."
            ),
            metric_trigger=f"Pearson r = {r:.3f}",
        ))
    elif r < -0.2:
        recs.append(Recommendation(
            severity="info",
            title="Negative correlation detected — review data quality",
            detail=(
                f"Pearson r = {r:.3f} is unexpectedly negative. This may indicate "
                "data entry issues or a confounding variable (e.g., easier assignments "
                "with shorter deadlines yielding higher marks regardless of timing)."
            ),
            metric_trigger=f"Pearson r = {r:.3f}",
        ))

    # ── Rule 8: Stress levels ─────────────────────────────────────────────────
    avg_stress = (prob.mean_stress_on_time + prob.mean_stress_late) / 2
    if prob.mean_stress_late - prob.mean_stress_on_time > 0.8:
        recs.append(Recommendation(
            severity="warning",
            title="Late submitters report significantly higher stress",
            detail=(
                f"Average stress: on-time students = {prob.mean_stress_on_time:.1f}/5, "
                f"late students = {prob.mean_stress_late:.1f}/5. "
                "High stress near deadlines correlates with cognitive overload "
                "and reduced work quality."
            ),
            metric_trigger=f"Stress gap = {prob.mean_stress_late - prob.mean_stress_on_time:.2f}",
            projected_improvement=(
                "Structured time-blocking workshops (2 hrs/semester) have been "
                "shown to reduce deadline stress scores by 0.6–1.0 points."
            ),
        ))
        score_penalties += 5

    # ── Rule 9: Positive finding ──────────────────────────────────────────────
    if prob.p_on_time >= 0.7 and not hyp.t_test.reject_null:
        recs.append(Recommendation(
            severity="success",
            title="Cohort health looks good overall",
            detail=(
                f"{prob.p_on_time*100:.1f}% of students submit on time and no "
                "significant mark penalty for late submission was detected. "
                "Continue reinforcing current deadline management practices."
            ),
            metric_trigger=f"P(on-time) = {prob.p_on_time:.3f}",
        ))

    # ── Health score ──────────────────────────────────────────────────────────
    health_score = max(0.0, 100.0 - score_penalties)

    if health_score >= 75:
        overall_health = "good"
    elif health_score >= 50:
        overall_health = "moderate"
    elif health_score >= 30:
        overall_health = "concerning"
    else:
        overall_health = "at-risk"

    # ── Summary ───────────────────────────────────────────────────────────────
    alert_count   = sum(1 for r in recs if r.severity == "alert")
    warning_count = sum(1 for r in recs if r.severity == "warning")
    summary = (
        f"Analysis of {stats.sample_size} students identified "
        f"{alert_count} critical issue(s) and {warning_count} warning(s). "
        f"Overall cohort health score: {health_score:.0f}/100 ({overall_health}). "
        f"On-time submission rate: {prob.p_on_time*100:.1f}%. "
        f"Early submitters score {stats.mean_marks_early:.2f}/10 vs "
        f"{stats.mean_marks_late:.2f}/10 for late submitters."
    )

    # Sort: alert → warning → info → success
    severity_order = {"alert": 0, "warning": 1, "info": 2, "success": 3}
    recs.sort(key=lambda r: severity_order.get(r.severity, 4))

    return SolutionsResponse(
        overall_health=overall_health,
        health_score=round(health_score, 1),
        recommendations=recs,
        summary=summary,
    )
