from fastapi import APIRouter, HTTPException
import store
from services.stats_engine import compute_stats
from services.probability_engine import compute_probability
from services.sampling_engine import compute_sampling
from services.hypothesis_engine import compute_hypothesis
from services.solutions_engine import compute_solutions
from models.schemas import SolutionsResponse

router = APIRouter(prefix="/api", tags=["solutions"])


def _require_data():
    if not store.has_data():
        raise HTTPException(status_code=400, detail="No data loaded. Upload a CSV first.")


@router.get("/solutions", response_model=SolutionsResponse)
def get_solutions():
    _require_data()
    df = store.get_df()
    stats   = compute_stats(df)
    prob    = compute_probability(df)
    sampling = compute_sampling(df)
    hyp     = compute_hypothesis(df)
    return compute_solutions(stats, prob, sampling, hyp)
