from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from app.models.postgres_models import ScamReport, User, Analytics
from app.schemas.scam import ScamReportCreate, ScamReportResponse
from typing import List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class PostgresService:
    """PostgreSQL database service for Neon DB"""
    
    def __init__(self):
        pass
    
    async def create_scam_report(self, db: AsyncSession, report_data: ScamReportCreate) -> ScamReport:
        """Create a new scam report"""
        try:
            db_report = ScamReport(**report_data.dict())
            db.add(db_report)
            await db.commit()
            await db.refresh(db_report)
            return db_report
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Failed to create scam report: {e}")
            raise
    
    async def get_scam_report_by_hash(self, db: AsyncSession, message_hash: str) -> Optional[ScamReport]:
        """Get scam report by message hash"""
        try:
            stmt = select(ScamReport).where(ScamReport.message_hash == message_hash)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"❌ Failed to get scam report by hash: {e}")
            raise
    
    async def get_scam_reports(self, db: AsyncSession, limit: int = 50, offset: int = 0) -> List[ScamReport]:
        """Get scam reports with pagination"""
        try:
            stmt = select(ScamReport).order_by(ScamReport.created_at.desc()).limit(limit).offset(offset)
            result = await db.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"❌ Failed to get scam reports: {e}")
            raise
    
    async def get_scam_reports_by_risk_level(self, db: AsyncSession, risk_level: str, limit: int = 50) -> List[ScamReport]:
        """Get scam reports by risk level"""
        try:
            stmt = select(ScamReport).where(ScamReport.risk_level == risk_level).order_by(ScamReport.created_at.desc()).limit(limit)
            result = await db.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"❌ Failed to get scam reports by risk level: {e}")
            raise
    
    async def update_scam_report(self, db: AsyncSession, message_hash: str, update_data: dict) -> Optional[ScamReport]:
        """Update scam report"""
        try:
            stmt = update(ScamReport).where(ScamReport.message_hash == message_hash).values(**update_data).returning(ScamReport)
            result = await db.execute(stmt)
            await db.commit()
            return result.scalar_one_or_none()
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Failed to update scam report: {e}")
            raise
    
    async def delete_scam_report(self, db: AsyncSession, message_hash: str) -> bool:
        """Delete scam report"""
        try:
            stmt = delete(ScamReport).where(ScamReport.message_hash == message_hash)
            result = await db.execute(stmt)
            await db.commit()
            return result.rowcount > 0
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Failed to delete scam report: {e}")
            raise
    
    async def get_statistics(self, db: AsyncSession) -> dict:
        """Get scam report statistics"""
        try:
            # Total reports
            total_stmt = select(func.count(ScamReport.id))
            total_result = await db.execute(total_stmt)
            total_reports = total_result.scalar()
            
            # Reports by risk level
            risk_stmt = select(ScamReport.risk_level, func.count(ScamReport.id)).group_by(ScamReport.risk_level)
            risk_result = await db.execute(risk_stmt)
            risk_levels = dict(risk_result.all())
            
            # Average scam score
            avg_stmt = select(func.avg(ScamReport.scam_score))
            avg_result = await db.execute(avg_stmt)
            avg_score = avg_result.scalar() or 0
            
            # Reports today
            today_stmt = select(func.count(ScamReport.id)).where(ScamReport.created_at >= datetime.now().date())
            today_result = await db.execute(today_stmt)
            today_reports = today_result.scalar()
            
            return {
                "total_reports": total_reports,
                "risk_levels": risk_levels,
                "average_scam_score": float(avg_score),
                "today_reports": today_reports
            }
        except Exception as e:
            logger.error(f"❌ Failed to get statistics: {e}")
            raise
    
    async def create_user(self, db: AsyncSession, wallet_address: str, email: Optional[str] = None) -> User:
        """Create a new user"""
        try:
            db_user = User(wallet_address=wallet_address, email=email)
            db.add(db_user)
            await db.commit()
            await db.refresh(db_user)
            return db_user
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Failed to create user: {e}")
            raise
    
    async def get_user_by_wallet(self, db: AsyncSession, wallet_address: str) -> Optional[User]:
        """Get user by wallet address"""
        try:
            stmt = select(User).where(User.wallet_address == wallet_address)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"❌ Failed to get user by wallet: {e}")
            raise
    
    async def create_analytics_record(self, db: AsyncSession, date: datetime, metric_type: str, metric_data: dict) -> Analytics:
        """Create analytics record"""
        try:
            import json
            db_analytics = Analytics(date=date, type=metric_type, metric_data=json.dumps(metric_data))
            db.add(db_analytics)
            await db.commit()
            await db.refresh(db_analytics)
            return db_analytics
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Failed to create analytics record: {e}")
            raise
    
    async def get_analytics_by_date_range(self, db: AsyncSession, start_date: datetime, end_date: datetime, metric_type: Optional[str] = None) -> List[Analytics]:
        """Get analytics records by date range"""
        try:
            stmt = select(Analytics).where(Analytics.date >= start_date, Analytics.date <= end_date)
            if metric_type:
                stmt = stmt.where(Analytics.type == metric_type)
            stmt = stmt.order_by(Analytics.date.desc())
            
            result = await db.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"❌ Failed to get analytics by date range: {e}")
            raise
