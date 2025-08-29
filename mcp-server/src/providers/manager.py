"""AI Provider Manager - Universal provider abstraction and routing"""

import asyncio
from typing import Dict, List, Optional, Any, AsyncGenerator
from ..providers.base import BaseAIProvider, TaskType, ProviderCapability, AIRequest, AIResponse
from ..providers.openrouter import OpenRouterProvider
from ..providers.minimax import MiniMaxProvider
from ..config import settings, ProviderType
import logging

logger = logging.getLogger(__name__)


class AIProviderManager:
    """Manages multiple AI providers with fallback and load balancing"""
    
    def __init__(self):
        self.providers: Dict[str, BaseAIProvider] = {}
        self.capabilities_cache: Dict[str, List[ProviderCapability]] = {}
        self.availability_cache: Dict[str, bool] = {}
        self.cache_ttl = 300  # 5 minutes
        self._last_cache_update = 0
        
    async def initialize(self):
        """Initialize all configured providers"""
        await self._load_providers()
        await self._update_capabilities_cache()
        
    async def _load_providers(self):
        """Load and configure providers"""
        # Load OpenRouter provider
        if settings.primary_provider == ProviderType.OPENROUTER or settings.fallback_provider == ProviderType.OPENROUTER:
            openrouter_config = {
                "api_key": settings.openrouter_api_key,
                "api_base": settings.openrouter_api_base,
                "site_url": settings.openrouter_site_url,
                "site_name": settings.openrouter_site_name,
                "default_model": settings.openrouter_default_model
            }
            self.providers["openrouter"] = OpenRouterProvider(openrouter_config)
            logger.info("OpenRouter provider loaded")
        
        # Load MiniMax provider (scaffolded)
        if settings.primary_provider == ProviderType.MINIMAX or settings.fallback_provider == ProviderType.MINIMAX:
            minimax_config = {
                "api_key": settings.minimax_api_key,
                "api_host": settings.minimax_api_host,
                "base_path": settings.minimax_base_path,
                "resource_mode": settings.minimax_resource_mode
            }
            self.providers["minimax"] = MiniMaxProvider(minimax_config)
            logger.info("MiniMax provider loaded (scaffolded)")
    
    async def _update_capabilities_cache(self):
        """Update provider capabilities cache"""
        import time
        current_time = time.time()
        
        if current_time - self._last_cache_update < self.cache_ttl:
            return
            
        for name, provider in self.providers.items():
            try:
                self.capabilities_cache[name] = await provider.get_capabilities()
                self.availability_cache[name] = await provider.is_available()
            except Exception as e:
                logger.error(f"Failed to update capabilities for {name}: {e}")
                self.availability_cache[name] = False
                
        self._last_cache_update = current_time
        logger.info("Provider capabilities cache updated")
    
    async def get_available_providers(self) -> List[str]:
        """Get list of available providers"""
        await self._update_capabilities_cache()
        return [name for name, available in self.availability_cache.items() if available]
    
    async def get_provider_for_task(self, task_type: TaskType, preferred_provider: Optional[str] = None) -> Optional[str]:
        """Get best provider for specific task type"""
        await self._update_capabilities_cache()
        
        # If preferred provider is specified and available
        if preferred_provider and preferred_provider in self.providers:
            if self.availability_cache.get(preferred_provider, False):
                capabilities = self.capabilities_cache.get(preferred_provider, [])
                if any(cap.task_type == task_type for cap in capabilities):
                    return preferred_provider
        
        # Use configured primary provider if available
        primary = settings.primary_provider.value
        if primary in self.providers and self.availability_cache.get(primary, False):
            capabilities = self.capabilities_cache.get(primary, [])
            if any(cap.task_type == task_type for cap in capabilities):
                return primary
        
        # Use fallback provider if available
        if settings.fallback_provider:
            fallback = settings.fallback_provider.value
            if fallback in self.providers and self.availability_cache.get(fallback, False):
                capabilities = self.capabilities_cache.get(fallback, [])
                if any(cap.task_type == task_type for cap in capabilities):
                    return fallback
        
        # Find any available provider that supports the task
        for name, available in self.availability_cache.items():
            if available:
                capabilities = self.capabilities_cache.get(name, [])
                if any(cap.task_type == task_type for cap in capabilities):
                    return name
        
        return None
    
    async def process_request(self, request: AIRequest, preferred_provider: Optional[str] = None) -> AIResponse:
        """Process AI request with provider selection and fallback"""
        provider_name = await self.get_provider_for_task(request.task_type, preferred_provider)
        
        if not provider_name:
            return AIResponse(
                task_type=request.task_type,
                model_used="unknown",
                content="",
                provider="none",
                success=False,
                error_message=f"No available provider supports task type: {request.task_type}"
            )
        
        provider = self.providers[provider_name]
        
        try:
            # Validate request
            if not await provider.validate_request(request):
                return AIResponse(
                    task_type=request.task_type,
                    model_used="unknown",
                    content="",
                    provider=provider_name,
                    success=False,
                    error_message="Request validation failed"
                )
            
            # Process request
            response = await provider.process_request(request)
            return response
            
        except Exception as e:
            logger.error(f"Provider {provider_name} failed: {e}")
            
            # Try fallback provider if primary failed
            if preferred_provider != provider_name:  # Prevent infinite recursion
                fallback_provider = await self.get_provider_for_task(request.task_type)
                if fallback_provider and fallback_provider != provider_name:
                    logger.info(f"Trying fallback provider: {fallback_provider}")
                    return await self.process_request(request, fallback_provider)
            
            return AIResponse(
                task_type=request.task_type,
                model_used="unknown",
                content="",
                provider=provider_name,
                success=False,
                error_message=f"Provider {provider_name} failed: {str(e)}"
            )
    
    async def stream_request(self, request: AIRequest, preferred_provider: Optional[str] = None) -> AsyncGenerator[AIResponse, None]:
        """Stream AI request with provider selection"""
        provider_name = await self.get_provider_for_task(request.task_type, preferred_provider)
        
        if not provider_name:
            yield AIResponse(
                task_type=request.task_type,
                model_used="unknown",
                content="",
                provider="none",
                success=False,
                error_message=f"No available provider supports task type: {request.task_type}"
            )
            return
        
        provider = self.providers[provider_name]
        
        try:
            # Validate request
            if not await provider.validate_request(request):
                yield AIResponse(
                    task_type=request.task_type,
                    model_used="unknown",
                    content="",
                    provider=provider_name,
                    success=False,
                    error_message="Request validation failed"
                )
                return
            
            # Stream request
            async for response in provider.stream_request(request):
                yield response
                
        except Exception as e:
            logger.error(f"Provider {provider_name} streaming failed: {e}")
            yield AIResponse(
                task_type=request.task_type,
                model_used="unknown",
                content="",
                provider=provider_name,
                success=False,
                error_message=f"Streaming failed: {str(e)}"
            )
    
    async def get_all_capabilities(self) -> Dict[str, List[ProviderCapability]]:
        """Get capabilities from all providers"""
        await self._update_capabilities_cache()
        return self.capabilities_cache.copy()
    
    async def get_provider_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status information for all providers"""
        await self._update_capabilities_cache()
        
        status = {}
        for name, provider in self.providers.items():
            status[name] = {
                "available": self.availability_cache.get(name, False),
                "capabilities": [cap.task_type.value for cap in self.capabilities_cache.get(name, [])],
                "provider_class": provider.__class__.__name__
            }
            
        return status


# Global provider manager instance
provider_manager = AIProviderManager()
