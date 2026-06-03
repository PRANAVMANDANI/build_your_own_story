from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field


class StoryOptionsSchema(BaseModel):
    text: str
    node_id: Optional[int] = None
    consequence: str = "cautious"
    risk_level: int = 1

class StoryNodeBase(BaseModel):
    content: str
    is_root: bool = False
    is_ending: bool = False
    is_winning_ending: bool = False
    mood: str = "mysterious"

class CompleteStoryNodeResponse(StoryNodeBase):
    id: int
    options: List[StoryOptionsSchema] = []

    class Config:
        from_attributes = True

class StoryBase(BaseModel):
    title: str
    session_id: Optional[str] = None

    class Config:
        from_attributes = True

class CreateStoryRequest(BaseModel):
    theme: str

class CompleteStoryResponse(StoryBase):
    id: int
    created_at: datetime
    root_node: Dict[int, CompleteStoryNodeResponse]

    class Config:
        from_attributes = True
