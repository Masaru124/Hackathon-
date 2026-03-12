from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # App settings
    PROJECT_NAME: str = "ScamShield AI"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database settings (Neon PostgreSQL only)
    DATABASE_URL: str = "postgresql://username:password@host:port/database_name"
    
    # AI Model settings
    MODEL_NAME: str = "distilbert-base-uncased"
    MODEL_CACHE_DIR: str = "./models"
    MAX_INPUT_LENGTH: int = 512
    
    # Blockchain settings
    BLOCKCHAIN_RPC_URL: str = "https://rpc-mumbai.maticvigil.com"
    CONTRACT_ADDRESS: str = ""
    PRIVATE_KEY: str = ""
    
    # Security settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS settings
    ALLOWED_HOSTS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ]
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10
    
    # Redis settings (for caching)
    REDIS_URL: str = "redis://localhost:6379"
    
    # File upload settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()
