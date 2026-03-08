from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ScanRequest(BaseModel):
    message: str = Field(..., max_length=2000, description="Message content to analyze")
    url: Optional[str] = Field(None, max_length=500, description="URL to analyze")

class BatchScanRequest(BaseModel):
    items: List[ScanRequest] = Field(..., max_items=10, description="Items to analyze")

class ReportRequest(BaseModel):
    message: str = Field(..., max_length=2000)
    url: Optional[str] = Field(None, max_length=500)
    scam_score: float = Field(..., ge=0, le=100)
    risk_level: str = Field(...)
    flagged_keywords: List[str] = Field(default_factory=list)
    flagged_urls: List[str] = Field(default_factory=list)
    explanation: str = Field(...)
    message_hash: str = Field(...)
    reporter_address: str = Field(...)
    category: Optional[str] = Field("other")

class BatchReportRequest(BaseModel):
    reports: List[ReportRequest] = Field(..., max_items=5)

class ScanResponse(BaseModel):
    success: bool
    scam_score: float
    risk_level: str
    flagged_keywords: List[str]
    flagged_urls: List[str]
    explanation: str
    message_hash: str
    url_analysis: dict
    ai_confidence: float
    timestamp: str
    is_new: Optional[bool] = None
    existing_reports: Optional[int] = None
    blockchain_confirmed: Optional[bool] = None
    category: Optional[str] = None
    status: Optional[str] = None

class ReportResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class StatsResponse(BaseModel):
    success: bool
    data: dict

class ReportsResponse(BaseModel):
    success: bool
    data: List[dict]
    pagination: dict

class BlockchainStatusResponse(BaseModel):
    success: bool
    data: dict
