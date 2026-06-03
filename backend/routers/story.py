import uuid 
from typing import Optional, Dict
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, Cookie, Response
from fastapi.responses import JSONResponse

from schemas.job import StoryJobBase, StoryJobResponse
from schemas.story import (
    CompleteStoryResponse, CompleteStoryNodeResponse, CreateStoryRequest, StoryOptionsSchema
)
from models.job import StoryJob
from sqlalchemy.orm import Session
from db.database import get_db, SessionLocal
from models.story import Story, StoryNode

router = APIRouter(
    prefix="/stories",
    tags=["stories"]
)

def get_session_id(session_id: str = Cookie(default=None)):
    if session_id is None:
        session_id = str(uuid.uuid4())
    return session_id

@router.post("/create",response_model=StoryJobResponse)
def create_story(
    request: CreateStoryRequest,
    background_tasks: BackgroundTasks,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Session = Depends(get_db),
):
    response.set_cookie("session_id", session_id, httponly=True)
    job_id = str(uuid.uuid4())
    job = StoryJob(
        job_id=job_id,
        session_id=session_id,
        theme=request.theme,
    )

    db.add(job)
    db.commit()

    #TODO : add background tasks, generate stories
    background_tasks.add_task(
        generate_story_task,
        job_id=job_id,
        theme=request.theme,
        session_id=session_id,
    )

    return job

def generate_story_task(
    job_id : str,
    theme : str,
    session_id : str,
):
    db = SessionLocal()

    try:
        # update job status to running 
        job = db.query(StoryJob).filter(StoryJob.job_id == job_id).first()
        
        if not job:
            return 

        try:
            job.status = "processing"
            db.commit()

            from core.story_generator import StoryGenerator
            story = StoryGenerator.generate_story(db, session_id, theme)
            
            job.story_id = story.id
            job.status = "completed"
            job.completed_at = datetime.now()
            db.commit()
        except Exception as e:
            job.status = "failed"
            job.completed_at = datetime.now()
            job.error = str(e)
            db.commit()
    finally:
        db.close() 
        

@router.get("/{story_id}/complete",response_model=CompleteStoryResponse)
def get_complete_story(story_id : int, db: Session = Depends(get_db)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    return build_complelete_story_tree(db, story)


def build_complelete_story_tree(db: Session, story: Story) -> CompleteStoryResponse:
    nodes_dict = {}
    for node in story.nodes:
        options_list = []
        if node.options:
            for opt in node.options:
                options_list.append(StoryOptionsSchema(
                    text=opt.get("text", ""),
                    node_id=opt.get("node_id"),
                    consequence=opt.get("consequence", "cautious"),
                    risk_level=opt.get("risk_level", 1),
                ))
        
        node_response = CompleteStoryNodeResponse(
            id=node.id,
            content=node.content,
            is_root=node.is_root,
            is_ending=node.is_ending,
            is_winning_ending=node.is_winning_ending,
            mood=node.mood or "mysterious",
            options=options_list
        )
        nodes_dict[node.id] = node_response
    
    return CompleteStoryResponse(
        id=story.id,
        title=story.title,
        session_id=story.session_id,
        created_at=story.created_at,
        root_node=nodes_dict
    )
        
