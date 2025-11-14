"""
EduMath AI Service - FastAPI Main Application
Matematik eğitimi için yapay zeka destekli mikro servis
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from app.routers import (
    question_generation,
    solution_analysis,
    recommendations,
    ocr,
    chatbot,
    performance_prediction
)

# Import middleware
from app.middleware.auth import verify_token
from app.middleware.rate_limit import RateLimitMiddleware


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 AI Service başlatılıyor...")
    print(f"📍 Port: {os.getenv('PORT', '8001')}")
    print(f"🔑 OpenAI Model: {os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')}")
    
    # Database connection (if needed)
    # await connect_to_mongo()
    
    yield
    
    # Shutdown
    print("🛑 AI Service durduruluyor...")
    # await close_mongo_connection()


# Initialize FastAPI app
app = FastAPI(
    title="EduMath AI Service",
    description="Matematik eğitimi için yapay zeka destekli mikro servis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# CORS Middleware
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Rate Limiting Middleware (optional)
# app.add_middleware(RateLimitMiddleware)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Servis sağlık kontrolü"""
    return {
        "status": "healthy",
        "service": "edumath-ai",
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/")
async def root():
    """Ana sayfa - API bilgileri"""
    return {
        "message": "EduMath AI Service",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "question_generation": "/api/ai/generate-questions",
            "solution_analysis": "/api/ai/analyze-solution",
            "recommendations": "/api/ai/recommend",
            "ocr": "/api/ai/ocr/math",
            "chatbot": "/api/ai/chat",
            "performance_prediction": "/api/ai/predict-performance"
        }
    }


# Include routers
app.include_router(
    question_generation.router,
    prefix="/api/ai",
    tags=["Question Generation"]
)

app.include_router(
    solution_analysis.router,
    prefix="/api/ai",
    tags=["Solution Analysis"]
)

app.include_router(
    recommendations.router,
    prefix="/api/ai",
    tags=["Recommendations"]
)

app.include_router(
    ocr.router,
    prefix="/api/ai/ocr",
    tags=["OCR"]
)

app.include_router(
    chatbot.router,
    prefix="/api/ai",
    tags=["Chatbot"]
)

app.include_router(
    performance_prediction.router,
    prefix="/api/ai",
    tags=["Performance Prediction"]
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Tüm hataları yakala ve logla"""
    print(f"❌ Error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "message": str(exc) if os.getenv("DEBUG") == "True" else "An error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
