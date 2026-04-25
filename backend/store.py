"""
Global in-memory store for the uploaded student DataFrame.
A single-user dev server; replace with Redis + session tokens for multi-user.
"""
import pandas as pd
from typing import Optional

_df: Optional[pd.DataFrame] = None


def set_df(df: pd.DataFrame) -> None:
    global _df
    _df = df.copy()


def get_df() -> Optional[pd.DataFrame]:
    return _df


def clear_df() -> None:
    global _df
    _df = None


def has_data() -> bool:
    return _df is not None and not _df.empty
