from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/o365_manager.db"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    
    secret_key: Optional[str] = None  # Will be auto-generated if not provided
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    graph_api_endpoint: str = "https://graph.microsoft.com/v1.0"
    graph_api_scope: str = "https://graph.microsoft.com/.default"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Auto-generate secret_key if not provided, too short, or using default
        if (not self.secret_key 
            or len(self.secret_key) < 32 
            or self.secret_key == "your-secret-key-here-change-in-production"):
            from app.secret_key_manager import get_or_create_secret_key
            generated_key = get_or_create_secret_key()
            if self.secret_key and len(self.secret_key) < 32:
                print(f"WARNING: SECRET_KEY in .env is too short ({len(self.secret_key)} chars)")
                print(f"Using auto-generated key instead ({len(generated_key)} chars)")
            self.secret_key = generated_key


@lru_cache()
def get_settings() -> Settings:
    return Settings()
