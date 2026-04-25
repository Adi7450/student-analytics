from fastapi import APIRouter, UploadFile, File, HTTPException
from services.data_loader import load_and_validate, get_summary
import store
from models.schemas import UploadResponse

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    raw = await file.read()
    df = load_and_validate(raw, file.filename)
    store.set_df(df)
    summary = get_summary(df)

    return UploadResponse(
        message="CSV uploaded and validated successfully.",
        **summary,
    )


@router.delete("/upload", tags=["upload"])
async def clear_data():
    store.clear_df()
    return {"message": "Data cleared."}
