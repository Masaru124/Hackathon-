from fastapi import APIRouter, HTTPException, Request
from typing import Optional
import logging

from app.schemas.scam import BlockchainStatusResponse
from app.services.blockchain_service import BlockchainService

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/status", response_model=BlockchainStatusResponse)
async def get_blockchain_status(request: Request):
    """Get blockchain connection status"""
    try:
        blockchain_service = BlockchainService()
        status = await blockchain_service.get_status()
        return BlockchainStatusResponse(success=True, data=status)
        
    except Exception as e:
        logger.error(f"❌ Blockchain status error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get blockchain status: {str(e)}")

@router.get("/reports")
async def get_blockchain_reports(
    limit: int = 50,
    request: Request = None
):
    """Get reports from blockchain"""
    try:
        blockchain_service = BlockchainService()
        reports = await blockchain_service.get_all_reports(limit)
        
        return {
            "success": True,
            "data": reports,
            "count": len(reports)
        }
        
    except Exception as e:
        logger.error(f"❌ Get blockchain reports error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch blockchain reports: {str(e)}")

@router.get("/reports/{message_hash}")
async def get_blockchain_report(
    message_hash: str,
    request: Request = None
):
    """Get specific report from blockchain"""
    try:
        blockchain_service = BlockchainService()
        report = await blockchain_service.get_scam_report(message_hash)
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found on blockchain")
        
        return {
            "success": True,
            "data": report
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get blockchain report error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch blockchain report: {str(e)}")

@router.get("/statistics")
async def get_blockchain_statistics(
    request: Request = None
):
    """Get blockchain statistics"""
    try:
        blockchain_service = BlockchainService()
        stats = await blockchain_service.get_statistics()
        
        return {
            "success": True,
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"❌ Blockchain statistics error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch blockchain statistics: {str(e)}")

@router.post("/report")
async def report_to_blockchain(
    data: dict,
    request: Request = None
):
    """Report scam to blockchain (internal endpoint)"""
    try:
        blockchain_service = BlockchainService()
        message_hash = data.get("messageHash")
        url = data.get("url", "")
        scam_score = data.get("scamScore")
        reporter_address = data.get("reporterAddress")
        
        if not message_hash or scam_score is None or not reporter_address:
            raise HTTPException(
                status_code=400,
                detail="messageHash, scamScore, and reporterAddress are required"
            )
        
        tx_hash = await blockchain_service.report_scam(message_hash, url, scam_score)
        
        return {
            "success": True,
            "transactionHash": tx_hash,
            "message": "Scam reported to blockchain successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Blockchain report error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to report to blockchain: {str(e)}")

@router.get("/transaction/{tx_hash}")
async def get_transaction_details(
    tx_hash: str,
    request: Request = None
):
    """Get transaction details"""
    try:
        # This would require additional implementation to get transaction receipt
        # For now, return mock data
        return {
            "success": True,
            "data": {
                "hash": tx_hash,
                "blockNumber": 12345,
                "status": "success",
                "timestamp": 1640995200
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Get transaction error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch transaction details: {str(e)}")
