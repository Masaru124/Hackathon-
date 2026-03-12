from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, Depends
from typing import List
import logging

from app.schemas.scam import ReportRequest, BatchReportRequest, ReportResponse
from app.services.ai_service import AIService
from app.services.blockchain_service import BlockchainService
from app.services.postgres_service import PostgresService
from app.core.database import get_db
from app.models.scam_report import ScamReportModel
from app.models.postgres_models import ScamReport
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

# Dependency injection
postgres_service = PostgresService()

@router.post("/", response_model=ReportResponse)
async def report_scam(
    request: ReportRequest,
    req: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Report a scam"""
    try:
        # Check if report already exists in PostgreSQL
        existing_report = await postgres_service.get_scam_report_by_hash(db, request.message_hash)
        
        if existing_report:
            # Increment report count for existing report
            await postgres_service.update_scam_report(db, request.message_hash, {
                "report_count": existing_report.report_count + 1,
                "updated_at": datetime.utcnow()
            })
            
            return ReportResponse(
                success=True,
                message="Report already exists, count incremented",
                data={
                    "reportId": str(existing_report.id),
                    "reportCount": existing_report.report_count + 1,
                    "blockchainConfirmed": existing_report.blockchain_confirmed
                }
            )
        
        # Create new report
        report_data = ScamReportModel(
            message_hash=request.message_hash,
            original_message=request.message,
            url=request.url,
            scam_score=request.scam_score,
            risk_level=request.risk_level,
            flagged_keywords=request.flagged_keywords,
            flagged_urls=request.flagged_urls,
            explanation=request.explanation,
            category=request.category,
            reporter_wallet=request.reporter_address,
            reporter_ip=req.client.host,
            user_agent=req.headers.get("user-agent")
        )
        
        # Insert into database
        result = await db.scam_reports.insert_one(report_data.dict())
        
        # Report to blockchain in background
        background_tasks.add_task(
            report_to_blockchain,
            str(result.inserted_id),
            request.message_hash,
            request.url or "",
            request.scam_score
        )
        
        return ReportResponse(
            success=True,
            message="Scam reported successfully",
            data={
                "reportId": str(result.inserted_id),
                "messageHash": request.message_hash,
                "reportCount": 1,
                "blockchainPending": True
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Report creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create report: {str(e)}")

@router.post("/batch", response_model=List[ReportResponse])
async def batch_report_scams(
    request: BatchReportRequest,
    req: Request,
    background_tasks: BackgroundTasks
):
    """Batch report multiple scams"""
    try:
        db = await get_db()
        results = []
        
        for report_data in request.reports:
            try:
                # Check if already exists
                existing = await db.scam_reports.find_one({"message_hash": report_data.message_hash})
                
                if existing:
                    await db.scam_reports.update_one(
                        {"message_hash": report_data.message_hash},
                        {
                            "$inc": {"report_count": 1},
                            "$set": {"updated_at": datetime.utcnow()}
                        }
                    )
                    
                    results.append(ReportResponse(
                        success=True,
                        messageHash=report_data.message_hash,
                        reportCount=existing["report_count"] + 1,
                        alreadyExisted=True
                    ))
                else:
                    # Create new report
                    report = ScamReportModel(
                        message_hash=report_data.message_hash,
                        original_message=report_data.message,
                        url=report_data.url,
                        scam_score=report_data.scam_score,
                        risk_level=report_data.risk_level,
                        flagged_keywords=report_data.flagged_keywords,
                        flagged_urls=report_data.flagged_urls,
                        explanation=report_data.explanation,
                        category=report_data.category,
                        reporter_wallet=report_data.reporter_address,
                        reporter_ip=req.client.host,
                        user_agent=req.headers.get("user-agent")
                    )
                    
                    result = await db.scam_reports.insert_one(report.dict())
                    
                    # Add blockchain task
                    background_tasks.add_task(
                        report_to_blockchain,
                        str(result.inserted_id),
                        report_data.message_hash,
                        report_data.url or "",
                        report_data.scam_score
                    )
                    
                    results.append(ReportResponse(
                        success=True,
                        messageHash=report_data.message_hash,
                        reportId=str(result.inserted_id),
                        reportCount=1,
                        blockchainPending=True
                    ))
                    
            except Exception as e:
                logger.error(f"❌ Batch report error for {report_data.message_hash}: {e}")
                results.append(ReportResponse(
                    success=False,
                    error=str(e)
                ))
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Batch reporting error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process batch reports: {str(e)}")

@router.get("/status/{report_id}")
async def get_report_status(report_id: str):
    """Get report status by ID"""
    try:
        from bson import ObjectId
        
        if not ObjectId.is_valid(report_id):
            raise HTTPException(status_code=400, detail="Invalid report ID format")
        
        db = await get_db()
        report = await db.scam_reports.find_one({"_id": ObjectId(report_id)})
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {
            "success": True,
            "data": {
                "reportId": report_id,
                "messageHash": report["message_hash"],
                "reportCount": report["report_count"],
                "scamScore": report["scam_score"],
                "riskLevel": report["risk_level"],
                "status": report["status"],
                "blockchain": {
                    "confirmed": report.get("blockchain_confirmed", False),
                    "txHash": report.get("blockchain_tx_hash"),
                    "blockNumber": report.get("blockchain_block_number")
                },
                "createdAt": report["created_at"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get report status error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch report status: {str(e)}")

@router.post("/confirm/{report_id}")
async def confirm_blockchain_transaction(
    report_id: str,
    tx_data: dict,
    background_tasks: BackgroundTasks
):
    """Confirm blockchain transaction (webhook)"""
    try:
        from bson import ObjectId
        
        tx_hash = tx_data.get("txHash")
        block_number = tx_data.get("blockNumber")
        
        if not tx_hash or not block_number:
            raise HTTPException(status_code=400, detail="txHash and blockNumber are required")
        
        if not ObjectId.is_valid(report_id):
            raise HTTPException(status_code=400, detail="Invalid report ID format")
        
        db = await get_db()
        
        # Update report with blockchain info
        result = await db.scam_reports.update_one(
            {"_id": ObjectId(report_id)},
            {
                "$set": {
                    "blockchain_tx_hash": tx_hash,
                    "blockchain_block_number": block_number,
                    "blockchain_confirmed": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {
            "success": True,
            "message": "Blockchain transaction confirmed",
            "data": {
                "txHash": tx_hash,
                "blockNumber": block_number,
                "confirmed": True
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Confirm blockchain error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to confirm blockchain transaction: {str(e)}")

async def report_to_blockchain(
    report_id: str,
    message_hash: str,
    url: str,
    scam_score: int
):
    """Background task to report scam to blockchain"""
    try:
        blockchain_service = BlockchainService()
        tx_hash = await blockchain_service.report_scam(message_hash, url, scam_score)
        
        # Update database with transaction hash
        db = await get_db()
        await db.scam_reports.update_one(
            {"_id": report_id},
            {
                "$set": {
                    "blockchain_tx_hash": tx_hash,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"✅ Reported to blockchain: {tx_hash}")
        
    except Exception as e:
        logger.error(f"❌ Blockchain reporting failed: {e}")
        # Don't raise - background task should fail silently
