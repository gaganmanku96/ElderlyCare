# Elderly Care Assistant - FastAPI Backend

Modern FastAPI backend server for enhanced Ollama integration with automatic OpenAPI documentation.

## 🚀 Features

- **FastAPI Framework**: High-performance async API with automatic docs
- **Pydantic Models**: Request/response validation and serialization
- **Modern Python**: Type hints using `list` instead of `List`, `dict` instead of `Dict`
- **Async HTTP Client**: httpx for better performance with Ollama
- **OpenAPI Documentation**: Auto-generated API docs at `/docs`
- **Environment Configuration**: Settings management with pydantic-settings

## 📊 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Core Endpoints

#### Health Check
```http
GET /health
```
Returns server and Ollama service health status.

**Response:**
```json
{
  "server_status": "healthy",
  "ollama_status": "healthy",
  "available_models": ["gemma3:4b-instruct-q4_0"],
  "gemma_available": true,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### Analyze User Query
```http
POST /api/analyze
```
Analyze user queries with optional screenshot images.

**Request Body:**
```json
{
  "query": "How do I change my WhatsApp profile picture?",
  "context": "whatsapp",
  "image": "base64_encoded_image_data",
  "model": "gemma3:4b-instruct-q4_0"
}
```

**Response:**
```json
{
  "guidance": "I'll help you change your WhatsApp profile picture step by step...",
  "steps": [
    "Open WhatsApp on your phone",
    "Look for three dots in the top-right corner",
    "Tap Settings from the menu"
  ],
  "confidence": 0.9,
  "model_used": "gemma3:4b-instruct-q4_0",
  "context": "whatsapp",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### Screenshot Analysis
```http
POST /api/screenshot
```
Specialized endpoint for screenshot analysis with default query.

**Request Body:**
```json
{
  "image": "base64_encoded_screenshot",
  "query": "What can I do on this screen?",
  "context": "general"
}
```

#### Available Models
```http
GET /api/models
```
Get list of available Ollama models.

**Response:**
```json
{
  "models": ["gemma3:4b-instruct-q4_0", "gemma3:27b-instruct-q4_0"],
  "recommended": "gemma3:4b-instruct-q4_0",
  "gemma_available": true
}
```

## 🔧 Setup & Installation

### 1. Install Dependencies
```bash
cd api
pip install -r requirements.txt
```

### 2. Environment Configuration
Create `.env` file:
```env
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=gemma3:4b-instruct-q4_0
MAX_IMAGE_SIZE=10485760
PORT=8000
DEBUG=false
```

### 3. Start the Server
```bash
# Development mode with auto-reload
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Or run directly
python server.py
```

### 4. Production Deployment
```bash
# Using uvicorn
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4

# Using gunicorn (install separately)
pip install gunicorn
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 🏗️ Technical Architecture

### Modern Python Features
- **Type Hints**: `list[str]` instead of `List[str]`
- **Union Types**: `str | None` instead of `Optional[str]`
- **Async/Await**: Full async support for better performance
- **Pydantic v2**: Latest validation and serialization
- **Settings Management**: Environment-based configuration

### Request/Response Models
```python
class AnalysisRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    context: str = Field(default="general")
    image: str | None = Field(default=None)
    model: str | None = Field(default=None)

class AnalysisResponse(BaseModel):
    guidance: str
    steps: list[str] | None = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    model_used: str
    context: str
    timestamp: str
```

### Error Handling
- HTTP status codes with appropriate error responses
- Structured error messages with timestamps
- Automatic validation error responses
- Graceful Ollama service failure handling

## 🔌 Integration with Frontend

### Direct Frontend Integration
Update `app/src/services/aiService.ts` to use the FastAPI backend:

```typescript
const API_BASE_URL = 'http://localhost:8000';

export const analyzeWithOllama = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
```

### Benefits Over Direct Ollama Integration
- **Request Validation**: Automatic Pydantic validation
- **Error Handling**: Structured error responses
- **Rate Limiting**: Can be added easily with middleware
- **Logging**: Structured request/response logging
- **Monitoring**: Health checks and metrics endpoints
- **CORS**: Proper cross-origin resource sharing

## 📈 Performance Considerations

### Async Architecture
- Non-blocking I/O with httpx
- Concurrent request handling
- Efficient resource utilization

### Memory Management
- Automatic request size validation
- Base64 image size limits (10MB default)
- Connection pooling with httpx

### Scalability
- Multiple worker processes with uvicorn/gunicorn
- Horizontal scaling ready
- Stateless design for load balancing

## 🔒 Security Features

### Input Validation
- Pydantic model validation
- Request size limits
- Content type validation

### CORS Configuration
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Configure for production
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### Environment Variables
- Sensitive configuration via environment
- No hardcoded secrets
- Production-ready settings management

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:8000/health

# Analyze query
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"query":"How do I make a call?","context":"phone"}'

# Get models
curl http://localhost:8000/api/models
```

### Interactive Testing
Visit http://localhost:8000/docs for Swagger UI with interactive API testing.

## 🚨 Troubleshooting

### Common Issues

**Server won't start:**
- Check if port 8000 is available
- Verify Python dependencies are installed
- Check Ollama service is running

**Ollama connection failed:**
- Ensure Ollama is running on localhost:11434
- Check firewall settings
- Verify Gemma 3 models are downloaded

**Validation errors:**
- Check request body matches Pydantic models
- Verify image data is properly base64 encoded
- Ensure required fields are provided

### Logs
Server logs provide detailed information about:
- Request processing
- Ollama communication
- Error details
- Performance metrics

The FastAPI backend provides a robust, modern foundation for the Elderly Care Assistant with excellent developer experience and production readiness.