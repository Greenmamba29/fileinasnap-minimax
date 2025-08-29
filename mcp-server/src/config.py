"""Configuration management for FileInASnap MCP Server"""

import os
from typing import Dict, List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field
from enum import Enum


class ProviderType(str, Enum):
    """Supported AI provider types"""
    OPENROUTER = "openrouter"
    MINIMAX = "minimax"


class OpenRouterModels(str, Enum):
    """Available OpenRouter free models"""
    MISTRAL_7B = "mistralai/mistral-7b-instruct"
    LLAMA_8B = "meta-llama/llama-3.1-8b-instruct"
    QWEN_7B = "qwen/qwen2-7b-instruct"
    FLAMINGO = "anthropic/claude-3-5-haiku-20241022"
    

class MiniMaxModels(str, Enum):
    """Available MiniMax models (scaffolded)"""
    TEXT_01 = "minimax-text-01"
    IMAGE_01 = "minimax-image-01"
    VIDEO_01 = "minimax-video-01"
    AUDIO_01 = "minimax-audio-01"


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Server Configuration
    server_host: str = Field(default="0.0.0.0", env="FILEINASNAP_HOST")
    server_port: int = Field(default="8000", env="FILEINASNAP_PORT")
    debug_mode: bool = Field(default=False, env="FILEINASNAP_DEBUG")
    
    # Provider Configuration
    primary_provider: ProviderType = Field(default=ProviderType.OPENROUTER, env="FILEINASNAP_PRIMARY_PROVIDER")
    fallback_provider: Optional[ProviderType] = Field(default=None, env="FILEINASNAP_FALLBACK_PROVIDER")
    
    # OpenRouter Configuration
    openrouter_api_key: Optional[str] = Field(default=None, env="OPENROUTER_API_KEY")
    openrouter_api_base: str = Field(default="https://openrouter.ai/api/v1", env="OPENROUTER_API_BASE")
    openrouter_site_url: str = Field(default="https://fileinasnap.io", env="OPENROUTER_SITE_URL")
    openrouter_site_name: str = Field(default="FileInASnap", env="OPENROUTER_SITE_NAME")
    openrouter_default_model: str = Field(default=OpenRouterModels.MISTRAL_7B, env="OPENROUTER_DEFAULT_MODEL")
    
    # MiniMax Configuration (Scaffolded)
    minimax_api_key: Optional[str] = Field(default=None, env="MINIMAX_API_KEY")
    minimax_api_host: str = Field(default="https://api.minimax.io", env="MINIMAX_API_HOST")
    minimax_base_path: Optional[str] = Field(default=None, env="MINIMAX_BASE_PATH")
    minimax_resource_mode: str = Field(default="url", env="MINIMAX_RESOURCE_MODE")
    
    # File Processing Configuration
    max_file_size_mb: int = Field(default=100, env="FILEINASNAP_MAX_FILE_SIZE_MB")
    supported_file_types: List[str] = Field(
        default=[
            "pdf", "docx", "txt", "md", "xlsx", "csv", 
            "jpg", "jpeg", "png", "gif", "webp", "bmp",
            "mp4", "avi", "mov", "mkv", "webm",
            "mp3", "wav", "ogg", "m4a", "flac"
        ],
        env="FILEINASNAP_SUPPORTED_TYPES"
    )
    
    # Processing Configuration
    batch_size: int = Field(default=10, env="FILEINASNAP_BATCH_SIZE")
    worker_processes: int = Field(default=4, env="FILEINASNAP_WORKERS")
    cache_ttl_hours: int = Field(default=24, env="FILEINASNAP_CACHE_TTL")
    
    # Rate Limiting
    rate_limit_requests: int = Field(default=100, env="FILEINASNAP_RATE_LIMIT")
    rate_limit_window: int = Field(default=3600, env="FILEINASNAP_RATE_WINDOW")
    
    # Storage Configuration
    temp_dir: str = Field(default="/tmp/fileinasnap", env="FILEINASNAP_TEMP_DIR")
    output_dir: str = Field(default="./output", env="FILEINASNAP_OUTPUT_DIR")
    
    # Redis Configuration (for caching and queue)
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # Database Configuration
    database_url: str = Field(default="sqlite:///fileinasnap.db", env="DATABASE_URL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


def get_settings() -> Settings:
    """Get application settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()
