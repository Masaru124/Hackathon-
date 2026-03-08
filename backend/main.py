from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.api import api_router
from app.services.ai_service import AIService
from app.services.blockchain_service import BlockchainService

load_dotenv()

# Global services
ai_service = None
blockchain_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global ai_service, blockchain_service
    
    print("🚀 Starting ScamShield AI Backend...")
    
    # Initialize database
    await init_db()
    print("📊 Database connected")
    
    # Initialize AI service
    ai_service = AIService()
    await ai_service.initialize()
    print("🤖 AI Model loaded")
    
    # Initialize blockchain service
    blockchain_service = BlockchainService()
    print("⛓️  Blockchain service initialized")
    
    # Store services in app state
    app.state.ai_service = ai_service
    app.state.blockchain_service = blockchain_service
    
    yield
    
    # Shutdown
    print("🛑 Shutting down services...")
    if ai_service:
        await ai_service.cleanup()

# Create FastAPI app
app = FastAPI(
    title="ScamShield AI API",
    description="AI-powered scam detection and blockchain registry",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "ai_model": "loaded" if ai_service else "not_loaded",
            "blockchain": "connected" if blockchain_service else "not_connected",
            "database": "connected"
        }
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ScamShield AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "Something went wrong"
        }
    )

# Dependency to get AI service
async def get_ai_service() -> AIService:
    return app.state.ai_service

# Dependency to get blockchain service
async def get_blockchain_service() -> BlockchainService:
    return app.state.blockchain_service

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
