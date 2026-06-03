from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routers import job, story
from db.database import create_tables 

create_tables()

app = FastAPI(
    title="Build your story - Game",
    description="Build your own story game using LLMs",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware, #cross origin resource sharing
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(story.router,prefix=settings.API_PREFIX)
app.include_router(job.router,prefix=settings.API_PREFIX)

if __name__ == "__main__":
    import uvicorn                              #use uvicorn syntax to run the app not this!
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


@app.get("/")
def read_root():
    return {"message": "Hello World"}
