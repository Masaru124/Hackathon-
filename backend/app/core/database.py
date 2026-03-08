from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Database client
client: AsyncIOMotorClient = None
database = None

async def get_db():
    """Get database instance"""
    return database

async def init_db():
    """Initialize database connection and indexes"""
    global client, database
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        database = client[settings.DATABASE_NAME]
        
        # Test connection
        await client.admin.command('ping')
        logger.info("✅ Connected to MongoDB")
        
        # Create indexes
        await create_indexes()
        
        logger.info("📊 Database initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to database: {e}")
        raise

async def create_indexes():
    """Create database indexes for performance"""
    try:
        # Scam reports indexes
        scam_reports = database.scam_reports
        await scam_reports.create_index("message_hash", unique=True)
        await scam_reports.create_index("scam_score")
        await scam_reports.create_index("risk_level")
        await scam_reports.create_index("created_at")
        await scam_reports.create_index("blockchain.confirmed")
        await scam_reports.create_index("category")
        
        # Users indexes
        users = database.users
        await users.create_index("wallet_address", unique=True)
        await users.create_index("email", unique=True, sparse=True)
        await users.create_index("created_at")
        
        # Analytics indexes
        analytics = database.analytics
        await analytics.create_index("date")
        await analytics.create_index("type")
        
        logger.info("📋 Database indexes created")
        
    except Exception as e:
        logger.error(f"❌ Failed to create indexes: {e}")
        raise

async def close_db():
    """Close database connection"""
    global client
    if client:
        client.close()
        logger.info("📊 Database connection closed")
