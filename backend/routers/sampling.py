from fastapi import APIRouter, HTTPException
import store
from services.sampling_engine import compute_sampling
from models.schemas import SamplingResponse

router = APIRouter(prefix="/api", tags=["sampling"])


def _require_data():
    if not store.has_data():
        raise HTTPException(status_code=400, detail="No data loaded. Upload a CSV first.")


@router.get("/sampling", response_model=SamplingResponse)
def get_sampling():
    _require_data()
    return compute_sampling(store.get_df())
