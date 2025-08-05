#!/usr/bin/env python3
"""
FastAPI backend server for Elderly Care Assistant
Provides REST endpoints for Ollama integration with modern Python practices

Features:
- FastAPI with automatic OpenAPI documentation
- Pydantic models for request/response validation
- Modern type hints (Python 3.9+)
- Async/await for better performance
- Structured logging and error handling
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from pydantic_settings import BaseSettings
from contextlib import asynccontextmanager
import httpx
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Settings with environment variable support
class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")

    ollama_base_url: str = "http://localhost:11434"
    default_model: str = "gemma3:4b-instruct-q4_0"
    max_image_size: int = 10 * 1024 * 1024  # 10MB
    port: int = 8000
    debug: bool = False


settings = Settings()


# Pydantic models for request/response validation
class AnalysisRequest(BaseModel):
    """Request model for query analysis"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "query": "How do I change my WhatsApp profile picture?",
                "context": "whatsapp",
                "image": None,
                "model": "gemma3:4b-instruct-q4_0",
            }
        }
    )

    query: str = Field(
        ..., min_length=1, max_length=1000, description="User's question or request"
    )
    context: str = Field(
        default="general",
        description="Current app context (whatsapp, phone, settings, general)",
    )
    image: str | None = Field(
        default=None, description="Base64 encoded screenshot image"
    )
    model: str | None = Field(
        default=None, description="Specific model to use (optional)"
    )


class ScreenshotRequest(BaseModel):
    """Request model for screenshot analysis"""

    image: str = Field(..., description="Base64 encoded screenshot")
    query: str = Field(
        default="What can I do on this screen?",
        description="Question about the screenshot",
    )
    context: str = Field(default="general", description="App context")


class AnalysisResponse(BaseModel):
    """Response model for query analysis"""

    guidance: str = Field(..., description="Step-by-step guidance for the user")
    steps: list[str] | None = Field(default=None, description="Extracted action steps")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score of the response"
    )
    model_used: str = Field(..., description="Model that generated the response")
    context: str = Field(..., description="App context used for the response")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class HealthResponse(BaseModel):
    """Health check response model"""

    server_status: str = Field(..., description="Server health status")
    ollama_status: str = Field(..., description="Ollama service status")
    available_models: list[str] = Field(..., description="Available Ollama models")
    gemma_available: bool = Field(
        ..., description="Whether Gemma 3 models are available"
    )
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class ErrorResponse(BaseModel):
    """Error response model"""

    error: str = Field(..., description="Error message")
    detail: str | None = Field(default=None, description="Additional error details")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


# Ollama client class
class OllamaClient:
    """Async HTTP client for Ollama API interactions"""

    def __init__(self, base_url: str = settings.ollama_base_url):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60.0)

    async def check_health(self) -> dict[str, any]:
        """Check Ollama service health and available models"""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()

            data = response.json()
            models = [model["name"] for model in data.get("models", [])]

            return {
                "status": "healthy",
                "models": models,
                "gemma_available": any("gemma3" in model for model in models),
            }
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "models": [],
                "gemma_available": False,
            }

    async def generate_response(
        self,
        model: str,
        prompt: str,
        images: list[str] | None = None,
        options: dict[str, any] | None = None,
    ) -> dict[str, any]:
        """Generate response from Ollama model"""
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": options
                or {"temperature": 0.3, "top_p": 0.9, "repeat_penalty": 1.1},
            }

            if images:
                payload["images"] = images

            response = await self.client.post(
                f"{self.base_url}/api/generate", json=payload
            )
            response.raise_for_status()

            return {"success": True, "data": response.json()}

        except httpx.HTTPStatusError as e:
            logger.error(
                f"Ollama HTTP error: {e.response.status_code} {e.response.text}"
            )
            return {
                "success": False,
                "error": f"Ollama error: {e.response.status_code} {e.response.text}",
            }
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")
            return {"success": False, "error": str(e)}

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Initialize Ollama client
ollama_client = OllamaClient()


# Modern lifespan handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("🚀 Starting Elderly Care Assistant API server")

    # Check Ollama connection
    health = await ollama_client.check_health()
    if health["status"] == "healthy":
        logger.info(f"✅ Connected to Ollama - Available models: {health['models']}")
        if health["gemma_available"]:
            logger.info("✅ Gemma 3 models detected")
        else:
            logger.warning("⚠️  No Gemma 3 models found")
    else:
        logger.warning(
            f"⚠️  Ollama not available: {health.get('error', 'Unknown error')}"
        )

    yield

    # Shutdown
    logger.info("🛑 Shutting down Elderly Care Assistant API server")
    await ollama_client.close()


# FastAPI application
app = FastAPI(
    title="Elderly Care Assistant API",
    description="FastAPI backend for AI-powered elderly smartphone assistance",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Routes
@app.get("/health", response_model=HealthResponse, summary="Health Check")
async def health_check():
    """Check server and Ollama service health"""
    ollama_health = await ollama_client.check_health()

    return HealthResponse(
        server_status="healthy",
        ollama_status=ollama_health["status"],
        available_models=ollama_health.get("models", []),
        gemma_available=ollama_health.get("gemma_available", False),
    )


@app.get("/api/models", summary="Get Available Models")
async def get_models():
    """Get list of available Ollama models"""
    health = await ollama_client.check_health()

    if health["status"] != "healthy":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ollama service not available",
        )

    return {
        "models": health["models"],
        "recommended": settings.default_model,
        "gemma_available": health["gemma_available"],
    }


@app.post(
    "/api/analyze",
    response_model=AnalysisResponse,
    responses={
        400: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    summary="Analyze User Query",
)
async def analyze_query(request: AnalysisRequest):
    """
    Analyze user query with optional screenshot image

    Provides elderly-friendly step-by-step guidance for smartphone tasks.
    Supports multimodal analysis with base64 encoded images.
    """
    try:
        # Validate image size if provided
        if request.image and len(request.image) > settings.max_image_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Image too large",
            )

        # Determine model to use
        model = request.model or settings.default_model

        # Build elderly-friendly system prompt
        system_prompt = f"""You are a patient, helpful AI assistant specifically designed to help elderly users learn smartphone technology.

Your characteristics:
- Use simple, clear language
- Break down tasks into small, manageable steps
- Be encouraging and patient
- Avoid technical jargon
- Repeat important information
- Assume the user may need extra reassurance

Current app context: {request.context}
{f'The user has provided a screenshot of their phone screen for you to analyze.' if request.image else ''}

User's question: "{request.query}"

Please provide step-by-step guidance that is easy to follow. If analyzing a screenshot, describe what you see and provide specific guidance based on the current screen."""

        # Prepare images list
        images = [request.image] if request.image else None

        # Generate response using Ollama
        result = await ollama_client.generate_response(
            model=model, prompt=system_prompt, images=images
        )

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate response: {result['error']}",
            )

        response_text = result["data"].get("response", "")

        # Extract numbered steps from response
        steps = extract_steps(response_text)

        return AnalysisResponse(
            guidance=response_text,
            steps=steps,
            confidence=0.9,
            model_used=model,
            context=request.context,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@app.post(
    "/api/screenshot", response_model=AnalysisResponse, summary="Analyze Screenshot"
)
async def analyze_screenshot(request: ScreenshotRequest):
    """
    Analyze a screenshot with optional query

    Specialized endpoint for screenshot analysis with default query.
    """
    analysis_request = AnalysisRequest(
        query=request.query, context=request.context, image=request.image
    )

    return await analyze_query(analysis_request)


# Utility functions
def extract_steps(text: str) -> list[str] | None:
    """Extract numbered steps from response text"""
    steps = []
    lines = text.split("\n")

    for line in lines:
        line = line.strip()
        if line and (line[0].isdigit() or line.lower().startswith("step")):
            # Clean up the step text
            clean_step = line
            if line[0].isdigit():
                # Remove "1." or "1)" numbering
                clean_step = line.split(".", 1)[-1].strip()
                clean_step = clean_step.split(")", 1)[-1].strip()
            elif line.lower().startswith("step"):
                # Remove "Step 1:" formatting
                clean_step = line.split(":", 1)[-1].strip()

            if clean_step:
                steps.append(clean_step)

    return steps if steps else None


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {"error": "Endpoint not found"}


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return {"error": "Internal server error"}


# Root endpoint
@app.get("/", summary="API Information")
async def root():
    """API information and documentation links"""
    return {
        "name": "Elderly Care Assistant API",
        "version": "1.0.0",
        "description": "FastAPI backend for AI-powered elderly smartphone assistance",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )
