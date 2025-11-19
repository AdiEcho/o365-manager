from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/o365_manager.db"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    graph_api_endpoint: str = "https://graph.microsoft.com/v1.0"
    graph_api_scope: str = "https://graph.microsoft.com/.default"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
