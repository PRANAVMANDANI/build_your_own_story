import sys
sys.path.insert(0, ".")
from db.database import SessionLocal
from models.job import StoryJob

db = SessionLocal()
try:
    jobs = db.query(StoryJob).order_by(StoryJob.created_at.desc()).limit(10).all()
    print(f"Total jobs: {db.query(StoryJob).count()}")
    for j in jobs:
        print(f"ID: {j.job_id} | Status: {j.status} | Theme: {j.theme} | Story ID: {j.story_id} | Error: {j.error}")
finally:
    db.close()
