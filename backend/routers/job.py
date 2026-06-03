import uuid 
from fastapi.responses import JSONResponse
from typing import Optional 
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, Cookie
from fastapi.responses import Response, JSONResponse
from sqlalchemy.orm import Session 
from db.database import get_db, SessionLocal 
from models.job import StoryJob 
from routers.story import build_complelete_story_tree
from schemas.job import StoryJobResponse

router = APIRouter(
    prefix="/jobs",
    tags=["jobs"]
)


@router.get("/{job_id}", response_model=StoryJobResponse)
def get_job_status(
    job_id: str = Path(...),
    db: Session = Depends(get_db)
):
    job = db.query(StoryJob).filter(StoryJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job 

