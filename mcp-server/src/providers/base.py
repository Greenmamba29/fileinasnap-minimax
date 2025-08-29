"""Universal AI Provider Interface"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union, AsyncGenerator
from pydantic import BaseModel
from enum import Enum


class TaskType(str, Enum):
    """Supported AI task types"""
    TEXT_GENERATION = "text_generation"
    IMAGE_GENERATION = "image_generation"
    VIDEO_GENERATION = "video_generation"
    AUDIO_GENERATION = "audio_generation"
    TEXT_TO_SPEECH = "text_to_speech"
    SPEECH_TO_TEXT = "speech_to_text"
    DOCUMENT_ANALYSIS = "document_analysis"
    IMAGE_ANALYSIS = "image_analysis"
    VIDEO_ANALYSIS = "video_analysis"
    AUDIO_ANALYSIS = "audio_analysis"
    CONTENT_CLASSIFICATION = "content_classification"
    SIMILARITY_SEARCH = "similarity_search"


class ProviderCapability(BaseModel):
    """Provider capability definition"""
    task_type: TaskType
    supported_models: List[str]
    max_input_size: Optional[int] = None
    max_output_size: Optional[int] = None
    rate_limit: Optional[int] = None
    cost_per_request: Optional[float] = None


class AIRequest(BaseModel):
    """Universal AI request format"""
    task_type: TaskType
    model: Optional[str] = None
    content: Union[str, bytes, Dict[str, Any]]
    parameters: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}


class AIResponse(BaseModel):
    """Universal AI response format"""
    task_type: TaskType
    model_used: str
    content: Union[str, bytes, Dict[str, Any]]
    metadata: Dict[str, Any] = {}
    usage_stats: Optional[Dict[str, Any]] = None
    provider: str
    success: bool = True
    error_message: Optional[str] = None


class BaseAIProvider(ABC):
    """Abstract base class for AI providers"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = self.__class__.__name__.lower().replace("provider", "")
        
    @abstractmethod
    async def get_capabilities(self) -> List[ProviderCapability]:
        """Get provider capabilities"""
        pass
    
    @abstractmethod
    async def is_available(self) -> bool:
        """Check if provider is available and configured"""
        pass
    
    @abstractmethod
    async def process_request(self, request: AIRequest) -> AIResponse:
        """Process AI request"""
        pass
    
    @abstractmethod
    async def stream_request(self, request: AIRequest) -> AsyncGenerator[AIResponse, None]:
        """Stream AI request for real-time responses"""
        pass
    
    async def validate_request(self, request: AIRequest) -> bool:
        """Validate request against provider capabilities"""
        capabilities = await self.get_capabilities()
        supported_tasks = [cap.task_type for cap in capabilities]
        return request.task_type in supported_tasks
    
    def get_default_model(self, task_type: TaskType) -> Optional[str]:
        """Get default model for task type"""
        # Override in subclasses
        return None
