from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    session_id = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    nodes = relationship("StoryNode", back_populates="story")


class StoryNode(Base):
    __tablename__ = "story_nodes"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id"), index = True)
    content = Column(String)
    is_root = Column(Boolean, default=False)
    is_ending = Column(Boolean, default=False)
    is_winning_ending = Column(Boolean, default=False)
    mood = Column(String, default="mysterious")
    options = Column(JSON, default=[])
    
    story = relationship("Story", back_populates="nodes")
    
