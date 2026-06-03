from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    API_PREFIX: str = "/api"

    DEBUG: bool = True

    GROQ_API_KEY: str

    DATABASE_URL: str = ""      #will add 

    ALLOWED_ORIGINS: Union[str, List[str]] = []

    @field_validator("ALLOWED_ORIGINS", mode="before")
    def parse_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if not v:
            return []
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


    class Config:
        case_sensitive = True
        env_file_encoding = "utf-8"
        env_file = ".env"

settings = Settings()
