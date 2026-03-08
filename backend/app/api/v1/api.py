from fastapi import APIRouter
from app.api.v1.endpoints import scam, report, stats, blockchain

api_router = APIRouter()

api_router.include_router(scam.router, prefix="/scam", tags=["scam"])
api_router.include_router(report.router, prefix="/report", tags=["report"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(blockchain.router, prefix="/blockchain", tags=["blockchain"])
