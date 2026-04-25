from fastapi import APIRouter, HTTPException
import store
from services.hypothesis_engine import compute_hypothesis
from models.schemas import HypothesisResponse

router = APIRouter(prefix="/api", tags=["hypothesis"])


def _require_data():
    if not store.has_data():
        raise HTTPException(status_code=400, detail="No data loaded. Upload a CSV first.")


@router.get("/hypothesis", response_model=HypothesisResponse)
def get_hypothesis():
    _require_data()
    return compute_hypothesis(store.get_df())
