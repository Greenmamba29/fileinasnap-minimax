"""OpenRouter AI Provider Implementation"""

import asyncio
import httpx
from typing import Any, Dict, List, Optional, AsyncGenerator
from ..providers.base import BaseAIProvider, TaskType, ProviderCapability, AIRequest, AIResponse
from ..config import settings
import json
import logging

logger = logging.getLogger(__name__)


class OpenRouterProvider(BaseAIProvider):
    """OpenRouter AI provider implementation"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key", settings.openrouter_api_key)
        self.api_base = config.get("api_base", settings.openrouter_api_base)
        self.site_url = config.get("site_url", settings.openrouter_site_url)
        self.site_name = config.get("site_name", settings.openrouter_site_name)
        self.default_model = config.get("default_model", settings.openrouter_default_model)
        
        # OpenRouter free models
        self.free_models = [
            "mistralai/mistral-7b-instruct",
            "meta-llama/llama-3.1-8b-instruct",
            "qwen/qwen2-7b-instruct",
            "google/gemma-2-9b-it",
            "microsoft/phi-3-mini-128k-instruct",
            "huggingface/zephyr-7b-beta"
        ]
        
    async def get_capabilities(self) -> List[ProviderCapability]:
        """Get OpenRouter capabilities"""
        return [
            ProviderCapability(
                task_type=TaskType.TEXT_GENERATION,
                supported_models=self.free_models + [
                    "openai/gpt-3.5-turbo",
                    "openai/gpt-4",
                    "anthropic/claude-3-haiku",
                    "anthropic/claude-3-sonnet"
                ],
                max_input_size=128000,
                max_output_size=4000,
                rate_limit=100
            ),
            ProviderCapability(
                task_type=TaskType.DOCUMENT_ANALYSIS,
                supported_models=self.free_models,
                max_input_size=100000,
                max_output_size=2000,
                rate_limit=50
            ),
            ProviderCapability(
                task_type=TaskType.IMAGE_ANALYSIS,
                supported_models=[
                    "openai/gpt-4-vision-preview",
                    "anthropic/claude-3-sonnet",
                    "google/gemini-pro-vision"
                ],
                max_input_size=20971520,  # 20MB
                rate_limit=20
            ),
            ProviderCapability(
                task_type=TaskType.CONTENT_CLASSIFICATION,
                supported_models=self.free_models,
                max_input_size=50000,
                max_output_size=1000,
                rate_limit=200
            )
        ]
    
    async def is_available(self) -> bool:
        """Check if OpenRouter is available"""
        try:
            async with httpx.AsyncClient() as client:
                headers = self._get_headers()
                response = await client.get(f"{self.api_base}/models", headers=headers, timeout=10)
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"OpenRouter availability check failed: {e}")
            return False
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers"""
        headers = {
            "Content-Type": "application/json",
            "HTTP-Referer": self.site_url,
            "X-Title": self.site_name
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            
        return headers
    
    def _select_model(self, request: AIRequest) -> str:
        """Select appropriate model for request"""
        if request.model:
            return request.model
            
        # Use free models when possible
        if request.task_type in [TaskType.TEXT_GENERATION, TaskType.DOCUMENT_ANALYSIS, TaskType.CONTENT_CLASSIFICATION]:
            return self.default_model
            
        # For image analysis, use a capable model
        if request.task_type == TaskType.IMAGE_ANALYSIS:
            return "openai/gpt-4-vision-preview"
            
        return self.default_model
    
    async def process_request(self, request: AIRequest) -> AIResponse:
        """Process AI request through OpenRouter"""
        try:
            model = self._select_model(request)
            
            if request.task_type == TaskType.TEXT_GENERATION:
                return await self._text_generation(request, model)
            elif request.task_type == TaskType.DOCUMENT_ANALYSIS:
                return await self._document_analysis(request, model)
            elif request.task_type == TaskType.IMAGE_ANALYSIS:
                return await self._image_analysis(request, model)
            elif request.task_type == TaskType.CONTENT_CLASSIFICATION:
                return await self._content_classification(request, model)
            else:
                return AIResponse(
                    task_type=request.task_type,
                    model_used=model,
                    content="",
                    provider=self.name,
                    success=False,
                    error_message=f"Task type {request.task_type} not supported by OpenRouter provider"
                )
                
        except Exception as e:
            logger.error(f"OpenRouter request failed: {e}")
            return AIResponse(
                task_type=request.task_type,
                model_used=model if 'model' in locals() else "unknown",
                content="",
                provider=self.name,
                success=False,
                error_message=str(e)
            )
    
    async def _text_generation(self, request: AIRequest, model: str) -> AIResponse:
        """Handle text generation requests"""
        async with httpx.AsyncClient(timeout=60) as client:
            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": str(request.content)
                    }
                ],
                **request.parameters
            }
            
            headers = self._get_headers()
            
            response = await client.post(
                f"{self.api_base}/chat/completions",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                
                return AIResponse(
                    task_type=request.task_type,
                    model_used=model,
                    content=content,
                    provider=self.name,
                    usage_stats=data.get("usage"),
                    metadata={
                        "finish_reason": data["choices"][0].get("finish_reason"),
                        "response_id": data.get("id")
                    }
                )
            else:
                raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")
    
    async def _document_analysis(self, request: AIRequest, model: str) -> AIResponse:
        """Handle document analysis requests"""
        analysis_prompt = f"""Please analyze the following document content and provide:
        1. Document type and format
        2. Key topics and themes
        3. Important entities (people, places, dates, etc.)
        4. Summary (2-3 sentences)
        5. Suggested tags for organization
        
        Document content:
        {request.content}
        
        Please format your response as JSON with the following structure:
        {{
            "document_type": "type",
            "topics": ["topic1", "topic2"],
            "entities": {{
                "people": [],
                "places": [],
                "dates": [],
                "organizations": []
            }},
            "summary": "summary text",
            "tags": ["tag1", "tag2"],
            "confidence": 0.95
        }}
        """
        
        analysis_request = AIRequest(
            task_type=TaskType.TEXT_GENERATION,
            content=analysis_prompt,
            parameters=request.parameters
        )
        
        response = await self._text_generation(analysis_request, model)
        
        if response.success:
            try:
                # Try to parse JSON response
                analysis_data = json.loads(response.content)
                response.content = analysis_data
                response.task_type = TaskType.DOCUMENT_ANALYSIS
            except json.JSONDecodeError:
                # If JSON parsing fails, keep as text
                pass
                
        return response
    
    async def _image_analysis(self, request: AIRequest, model: str) -> AIResponse:
        """Handle image analysis requests"""
        # For image analysis, we need to handle base64 encoded images
        analysis_prompt = """Please analyze this image and provide:
        1. Description of the main content
        2. Objects detected in the image
        3. Text content if any (OCR)
        4. Suggested tags for categorization
        5. Image quality and technical details
        
        Format your response as JSON.
        """
        
        async with httpx.AsyncClient(timeout=60) as client:
            # Handle different image input formats
            if isinstance(request.content, str) and request.content.startswith("data:image"):
                image_content = request.content
            elif isinstance(request.content, bytes):
                import base64
                image_content = f"data:image/jpeg;base64,{base64.b64encode(request.content).decode()}"
            else:
                image_content = str(request.content)
            
            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": analysis_prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_content
                                }
                            }
                        ]
                    }
                ],
                **request.parameters
            }
            
            headers = self._get_headers()
            
            response = await client.post(
                f"{self.api_base}/chat/completions",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                
                try:
                    # Try to parse JSON response
                    analysis_data = json.loads(content)
                    content = analysis_data
                except json.JSONDecodeError:
                    # Keep as text if JSON parsing fails
                    pass
                
                return AIResponse(
                    task_type=TaskType.IMAGE_ANALYSIS,
                    model_used=model,
                    content=content,
                    provider=self.name,
                    usage_stats=data.get("usage"),
                    metadata={
                        "finish_reason": data["choices"][0].get("finish_reason"),
                        "response_id": data.get("id")
                    }
                )
            else:
                raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")
    
    async def _content_classification(self, request: AIRequest, model: str) -> AIResponse:
        """Handle content classification requests"""
        classification_prompt = f"""Please classify the following content into appropriate categories:
        
        Content: {request.content}
        
        Provide classification results in JSON format:
        {{
            "primary_category": "main category",
            "secondary_categories": ["cat1", "cat2"],
            "content_type": "document/image/video/audio",
            "language": "detected language",
            "sentiment": "positive/negative/neutral",
            "confidence": 0.95,
            "suggested_folder": "folder name",
            "tags": ["tag1", "tag2"]
        }}
        """
        
        classification_request = AIRequest(
            task_type=TaskType.TEXT_GENERATION,
            content=classification_prompt,
            parameters=request.parameters
        )
        
        response = await self._text_generation(classification_request, model)
        
        if response.success:
            try:
                # Try to parse JSON response
                classification_data = json.loads(response.content)
                response.content = classification_data
                response.task_type = TaskType.CONTENT_CLASSIFICATION
            except json.JSONDecodeError:
                # If JSON parsing fails, keep as text
                pass
                
        return response
    
    async def stream_request(self, request: AIRequest) -> AsyncGenerator[AIResponse, None]:
        """Stream AI request for real-time responses"""
        try:
            model = self._select_model(request)
            
            async with httpx.AsyncClient(timeout=120) as client:
                payload = {
                    "model": model,
                    "messages": [
                        {
                            "role": "user",
                            "content": str(request.content)
                        }
                    ],
                    "stream": True,
                    **request.parameters
                }
                
                headers = self._get_headers()
                
                async with client.stream(
                    "POST",
                    f"{self.api_base}/chat/completions",
                    json=payload,
                    headers=headers
                ) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:]  # Remove "data: " prefix
                                if data_str.strip() == "[DONE]":
                                    break
                                    
                                try:
                                    data = json.loads(data_str)
                                    if "choices" in data and data["choices"]:
                                        delta = data["choices"][0].get("delta", {})
                                        content = delta.get("content", "")
                                        
                                        if content:
                                            yield AIResponse(
                                                task_type=request.task_type,
                                                model_used=model,
                                                content=content,
                                                provider=self.name,
                                                metadata={
                                                    "streaming": True,
                                                    "response_id": data.get("id")
                                                }
                                            )
                                except json.JSONDecodeError:
                                    continue
                    else:
                        raise Exception(f"OpenRouter streaming error: {response.status_code}")
                        
        except Exception as e:
            logger.error(f"OpenRouter streaming failed: {e}")
            yield AIResponse(
                task_type=request.task_type,
                model_used=model if 'model' in locals() else "unknown",
                content="",
                provider=self.name,
                success=False,
                error_message=str(e)
            )
    
    def get_default_model(self, task_type: TaskType) -> Optional[str]:
        """Get default model for task type"""
        if task_type in [TaskType.TEXT_GENERATION, TaskType.DOCUMENT_ANALYSIS, TaskType.CONTENT_CLASSIFICATION]:
            return self.default_model
        elif task_type == TaskType.IMAGE_ANALYSIS:
            return "openai/gpt-4-vision-preview"
        return None
