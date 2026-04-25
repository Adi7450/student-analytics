"""
data_loader.py
Parses the uploaded CSV, enforces column names, cleans types,
and derives computed columns used throughout the analysis.
"""
import io
import pandas as pd
import numpy as np
from fastapi import HTTPException

# ── Expected column names (match your Google Form export headers exactly) ──────
REQUIRED_COLUMNS = {
    "submitted_on_time",          # Yes / No
    "days_before_deadline",       # numeric (negative = late)
    "total_hours_spent",          # numeric
    "hours_per_day_final_week",   # numeric
    "marks",                      # 1–10
    "total_assignments",          # integer
    "late_submissions",           # integer
    "missed_submissions",         # integer
    "stress_level",               # 1–5
    "overload_frequency",         # 1–5
}

OPTIONAL_COLUMNS = {"cgpa"}

# Allowed "yes" synonyms (case-insensitive)
YES_VALUES = {"yes", "y", "true", "1", "on time", "on-time", "before"}


def load_and_validate(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """
    Accepts raw CSV bytes, validates columns, coerces types,
    and returns a clean DataFrame with derived columns.
    """
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    # Normalise column names: strip whitespace, lowercase, replace spaces/hyphens
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(r"[\s\-/]+", "_", regex=True)
        .str.replace(r"[^a-z0-9_]", "", regex=True)
    )

    # Check required columns
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=422,
            detail=(
                f"CSV is missing required columns: {sorted(missing)}. "
                "Please rename your Google Form export headers to match "
                "the expected column names listed in the documentation."
            ),
        )

    # ── Type coercion ──────────────────────────────────────────────────────────
    # submitted_on_time → bool
    df["submitted_on_time"] = (
        df["submitted_on_time"]
        .astype(str)
        .str.strip()
        .str.lower()
        .isin(YES_VALUES)
    )

    numeric_cols = [
        "days_before_deadline",
        "total_hours_spent",
        "hours_per_day_final_week",
        "marks",
        "total_assignments",
        "late_submissions",
        "missed_submissions",
        "stress_level",
        "overload_frequency",
    ]
    if "cgpa" in df.columns:
        numeric_cols.append("cgpa")

    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # ── Drop rows where critical fields are null ───────────────────────────────
    critical = ["days_before_deadline", "marks", "submitted_on_time"]
    before = len(df)
    df = df.dropna(subset=critical).reset_index(drop=True)
    if len(df) == 0:
        raise HTTPException(
            status_code=422,
            detail="No valid rows remain after cleaning. Check your CSV data."
        )

    # ── Clamp ranges ──────────────────────────────────────────────────────────
    df["marks"] = df["marks"].clip(1, 10)
    df["stress_level"] = df["stress_level"].clip(1, 5)
    df["overload_frequency"] = df["overload_frequency"].clip(1, 5)

    # ── Derived columns ───────────────────────────────────────────────────────
    # on_time as integer for math
    df["on_time_int"] = df["submitted_on_time"].astype(int)

    # Late rate per student: late_submissions / total_assignments
    df["personal_late_rate"] = np.where(
        df["total_assignments"] > 0,
        df["late_submissions"] / df["total_assignments"],
        np.nan,
    )

    # Study intensity: hours_per_day_final_week (already a column)
    # High study = above median
    median_study = df["hours_per_day_final_week"].median()
    df["high_study"] = df["hours_per_day_final_week"] >= median_study

    # Early vs late group label
    df["group"] = df["submitted_on_time"].map({True: "Early", False: "Late"})

    # High marks = above dataset mean
    mean_marks = df["marks"].mean()
    df["high_marks"] = df["marks"] >= mean_marks

    return df


def get_summary(df: pd.DataFrame) -> dict:
    return {
        "rows": len(df),
        "columns": list(df.columns),
        "on_time_count": int(df["submitted_on_time"].sum()),
        "late_count": int((~df["submitted_on_time"]).sum()),
    }
