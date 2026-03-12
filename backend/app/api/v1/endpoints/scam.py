from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from typing import List
import logging

from app.schemas.scam import ScanRequest, BatchScanRequest, ScanResponse
from app.services.ai_service import AIService
from app.core.database import get_db
from app.services.postgres_service import PostgresService
from app.models.postgres_models import ScamReport
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()

# Dependency injection
postgres_service = PostgresService()

@router.post("/scan", response_model=ScanResponse)
async def scan_message(
    request: ScanRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    """Scan message for scam detection"""
    try:
        ai_service = AIService()
        await ai_service.initialize()
        
        # Analyze message
        result = await ai_service.analyze_message(request.message, request.url or "")
        
        # Check if already exists in database (PostgreSQL)
        existing_report = await postgres_service.get_scam_report_by_hash(db, result["message_hash"])
        
        response = ScanResponse(
            success=True,
            **result,
            is_new=existing_report is None,
            existing_reports=existing_report.report_count if existing_report else 0
        )
        
        # Add additional context if existing report found
        if existing_report:
            response.blockchain_confirmed = existing_report.blockchain_confirmed
            response.category = existing_report.category
            response.status = existing_report.status
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Scan error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to scan message: {str(e)}")

@router.post("/batch-scan", response_model=List[ScanResponse])
async def batch_scan_messages(
    request: BatchScanRequest,
    req: Request
):
    """Batch scan multiple messages"""
    try:
        ai_service = AIService()
        await ai_service.initialize()
        
        results = []
        
        for item in request.items:
            result = await ai_service.analyze_message(item.message, item.url or "")
            results.append(ScanResponse(success=True, **result))
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Batch scan error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to batch scan: {str(e)}")

@router.get("/reports")
async def get_reports(
    page: int = 1,
    limit: int = 20,
    risk_level: str = None,
    category: str = None,
    confirmed: bool = None
):
    """Get scam reports with pagination and filters"""
    try:
        db = await get_db()
        
        # Build filter
        filter_dict = {}
        if risk_level:
            filter_dict["risk_level"] = risk_level
        if category:
            filter_dict["category"] = category
        if confirmed is not None:
            filter_dict["blockchain_confirmed"] = confirmed
        
        # Calculate skip
        skip = (page - 1) * limit
        
        # Get reports
        cursor = db.scam_reports.find(filter_dict).sort("created_at", -1).skip(skip).limit(limit)
        reports = await cursor.to_list(length=limit)
        
        # Get total count
        total = await db.scam_reports.count_documents(filter_dict)
        
        # Convert ObjectId to string and exclude original_message for privacy
        for report in reports:
            report["_id"] = str(report["_id"])
            if "original_message" in report:
                del report["original_message"]
        
        return {
            "success": True,
            "data": reports,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Get reports error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")

@router.get("/reports/{message_hash}")
async def get_report(message_hash: str):
    """Get specific report by message hash"""
    try:
        db = await get_db()
        report = await db.scam_reports.find_one({"message_hash": message_hash})
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Convert ObjectId to string
        report["_id"] = str(report["_id"])
        
        return {
            "success": True,
            "data": report
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get report error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch report: {str(e)}")

@router.get("/check/{message_hash}")
async def check_message_hash(message_hash: str):
    """Check if message hash exists"""
    try:
        db = await get_db()
        report = await db.scam_reports.find_one(
            {"message_hash": message_hash},
            {"message_hash": 1, "report_count": 1, "scam_score": 1, "blockchain_confirmed": 1}
        )
        
        return {
            "success": True,
            "exists": report is not None,
            "reportCount": report["report_count"] if report else 0,
            "scamScore": report["scam_score"] if report else 0,
            "blockchainConfirmed": report.get("blockchain_confirmed", False) if report else False
        }
        
    except Exception as e:
        logger.error(f"❌ Check hash error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check message hash: {str(e)}")
