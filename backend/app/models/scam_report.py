from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId
import hashlib

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class ScamReportModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    message_hash: str = Field(..., description="SHA256 hash of the message")
    original_message: str = Field(..., max_length=2000, description="Original message content")
    url: Optional[str] = Field(None, max_length=500, description="Suspicious URL if any")
    scam_score: float = Field(..., ge=0, le=100, description="Scam probability score")
    risk_level: str = Field(..., description="Risk level classification")
    flagged_keywords: List[str] = Field(default_factory=list, description="Suspicious keywords found")
    flagged_urls: List[str] = Field(default_factory=list, description="Suspicious URLs found")
    explanation: str = Field(..., description="AI explanation of the analysis")
    
    # Reporter information
    reporter_wallet: str = Field(..., description="Reporter's wallet address")
    reporter_ip: str = Field(..., description="Reporter's IP address")
    user_agent: Optional[str] = Field(None, description="Reporter's user agent")
    
    # Blockchain information
    blockchain_tx_hash: Optional[str] = Field(None, description="Blockchain transaction hash")
    blockchain_block_number: Optional[int] = Field(None, description="Blockchain block number")
    blockchain_confirmed: bool = Field(default=False, description="Blockchain confirmation status")
    
    # Classification
    category: str = Field(default="other", description="Scam category")
    status: str = Field(default="pending", description="Report status")
    report_count: int = Field(default=1, description="Number of times this scam has been reported")
    
    # Metadata
    message_length: int = Field(default=0, description="Length of the original message")
    url_count: int = Field(default=0, description="Number of URLs found")
    keyword_count: int = Field(default=0, description="Number of suspicious keywords")
    urgency_indicators: int = Field(default=0, description="Number of urgency indicators")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        from_attributes = True

    @field_validator('message_hash')
    @classmethod
    def validate_message_hash(cls, v):
        if not v:
            raise ValueError('Message hash cannot be empty')
        return v

    @field_validator('risk_level')
    @classmethod
    def validate_risk_level(cls, v):
        valid_levels = ['SAFE', 'LOW_RISK', 'SUSPICIOUS', 'HIGH_RISK', 'SCAM']
        if v not in valid_levels:
            raise ValueError(f'Risk level must be one of: {valid_levels}')
        return v

    @field_validator('category')
    @classmethod
    def validate_category(cls, v):
        valid_categories = [
            'phishing', 'impersonation', 'lottery_scam', 'employment_scam',
            'fake_giveaway', 'malware', 'investment_scam', 'romance_scam',
            'tech_support', 'other'
        ]
        if v not in valid_categories:
            raise ValueError(f'Category must be one of: {valid_categories}')
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        valid_statuses = ['pending', 'confirmed', 'false_positive', 'under_review']
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of: {valid_statuses}')
        return v

    @field_validator('reporter_wallet')
    @classmethod
    def validate_wallet_address(cls, v):
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid Ethereum wallet address format')
        return v.lower()

    @field_validator('message_length')
    @classmethod
    def calculate_message_length(cls, v, info):
        if info.data and 'original_message' in info.data:
            return len(info.data['original_message'])
        return v

    @field_validator('url_count')
    @classmethod
    def calculate_url_count(cls, v, info):
        if info.data and 'flagged_urls' in info.data:
            return len(info.data['flagged_urls'])
        return v

    @field_validator('keyword_count')
    @classmethod
    def calculate_keyword_count(cls, v, info):
        if info.data and 'flagged_keywords' in info.data:
            return len(info.data['flagged_keywords'])
        return v

    @field_validator('urgency_indicators')
    @classmethod
    def calculate_urgency_indicators(cls, v, info):
        if info.data and 'flagged_keywords' in info.data:
            urgency_words = ['urgent', 'immediate', 'limited time', 'act now', 'expires soon']
            keywords = [k.lower() for k in info.data['flagged_keywords']]
            return sum(1 for word in urgency_words if word in keywords)
        return v

    def generate_message_hash(self, message: str, url: str = "") -> str:
        """Generate SHA256 hash of message and URL"""
        content = f"{message}{url}"
        return hashlib.sha256(content.encode()).hexdigest()

class ScamReportCreate(BaseModel):
    original_message: str = Field(..., max_length=2000)
    url: Optional[str] = Field(None, max_length=500)
    scam_score: float = Field(..., ge=0, le=100)
    risk_level: str = Field(...)
    flagged_keywords: List[str] = Field(default_factory=list)
    flagged_urls: List[str] = Field(default_factory=list)
    explanation: str = Field(...)
    category: str = Field(default="other")
    reporter_wallet: str = Field(...)
    reporter_ip: str = Field(...)
    user_agent: Optional[str] = Field(None)

class ScamReportUpdate(BaseModel):
    status: Optional[str] = None
    category: Optional[str] = None
    blockchain_tx_hash: Optional[str] = None
    blockchain_block_number: Optional[int] = None
    blockchain_confirmed: Optional[bool] = None

class ScamReportResponse(BaseModel):
    id: str
    message_hash: str
    scam_score: float
    risk_level: str
    flagged_keywords: List[str]
    flagged_urls: List[str]
    explanation: str
    category: str
    status: str
    report_count: int
    blockchain_confirmed: bool
    created_at: datetime

    model_config = {"from_attributes": True}
