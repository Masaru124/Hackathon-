from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class ScamReport(Base):
    __tablename__ = "scam_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    message_hash = Column(String(64), unique=True, nullable=False, index=True)
    original_message = Column(Text, nullable=False)
    url = Column(String(500))
    scam_score = Column(Float, nullable=False, index=True)
    risk_level = Column(String(20), nullable=False, index=True)
    flagged_keywords = Column(ARRAY(String))
    flagged_urls = Column(ARRAY(String))
    explanation = Column(Text, nullable=False)
    reporter_wallet = Column(String(42), nullable=False, index=True)
    reporter_ip = Column(String(45), nullable=False)
    user_agent = Column(Text)
    blockchain_tx_hash = Column(String(66))
    blockchain_block_number = Column(Integer)
    blockchain_confirmed = Column(Boolean, default=False, index=True)
    category = Column(String(30), default='other', index=True)
    status = Column(String(20), default='pending')
    report_count = Column(Integer, default=1)
    message_length = Column(Integer, default=0)
    url_count = Column(Integer, default=0)
    keyword_count = Column(Integer, default=0)
    urgency_indicators = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String(42), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, index=True)
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)
    metric_data = Column(Text)  # JSON data as text
    created_at = Column(DateTime, default=func.now(), index=True)
