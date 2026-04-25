from fastapi import APIRouter, HTTPException
import store
from services.stats_engine import compute_stats
from models.schemas import StatsResponse

router = APIRouter(prefix="/api", tags=["statistics"])


def _require_data():
    if not store.has_data():
        raise HTTPException(
            status_code=400,
            detail="No data loaded. Please upload a CSV file first."
        )


@router.get("/stats", response_model=StatsResponse)
def get_stats():
    _require_data()
    return compute_stats(store.get_df())
