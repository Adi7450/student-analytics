from fastapi import APIRouter, HTTPException
import store
from services.probability_engine import compute_probability
from models.schemas import ProbabilityResponse

router = APIRouter(prefix="/api", tags=["probability"])


def _require_data():
    if not store.has_data():
        raise HTTPException(status_code=400, detail="No data loaded. Upload a CSV first.")


@router.get("/probability", response_model=ProbabilityResponse)
def get_probability():
    _require_data()
    return compute_probability(store.get_df())
