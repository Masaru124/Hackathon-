from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# PostgreSQL setup
engine = None
async_session = None

if hasattr(settings, 'DATABASE_URL') and settings.DATABASE_URL and 'port' not in settings.DATABASE_URL:
    try:
        # Use asyncpg for async PostgreSQL connection
        if 'postgresql://' in settings.DATABASE_URL:
            # Clean up the DATABASE_URL for asyncpg
            db_url = settings.DATABASE_URL
            
            # Replace postgresql:// with postgresql+asyncpg://
            if db_url.startswith('postgresql://'):
                db_url = db_url.replace('postgresql://', 'postgresql+asyncpg://', 1)
            
            # Remove sslmode parameter as asyncpg handles SSL differently
            if '?sslmode=' in db_url:
                db_url = db_url.split('?sslmode=')[0]
            elif '&sslmode=' in db_url:
                db_url = db_url.split('&sslmode=')[0]
            
            # Remove trailing ? or & if present
            if db_url.endswith('?') or db_url.endswith('&'):
                db_url = db_url[:-1]
            
            engine = create_async_engine(
                db_url,
                # Add SSL configuration separately
                connect_args={"ssl": True} if 'ssl' in settings.DATABASE_URL.lower() else {}
            )
            async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            logger.info("✅ PostgreSQL engine initialized with asyncpg")
        else:
            logger.error("❌ Invalid DATABASE_URL format - must be postgresql://")
            engine = None
            async_session = None
    except Exception as e:
        logger.error(f"❌ Failed to initialize PostgreSQL: {e}")
        engine = None
        async_session = None
else:
    logger.error("❌ DATABASE_URL not properly configured")

async def get_db():
    """Get database instance (PostgreSQL)"""
    if not async_session:
        raise RuntimeError("Database not initialized. Please check DATABASE_URL configuration.")
    
    async with async_session() as session:
        yield session

async def init_db():
    """Initialize database connection and tables"""
    try:
        if not engine:
            raise RuntimeError("PostgreSQL engine not initialized")
        
        # Initialize PostgreSQL
        await init_postgres()
        
        logger.info("📊 Database initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to database: {e}")
        raise

async def init_postgres():
    """Initialize PostgreSQL connection and tables"""
    try:
        # Test connection
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
        
        logger.info("✅ Connected to PostgreSQL (Neon)")
        
        # Create tables if they don't exist
        await create_postgres_tables()
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to PostgreSQL: {e}")
        raise

async def create_postgres_tables():
    """Create PostgreSQL tables"""
    try:
        async with async_session() as session:
            # Create scam_reports table
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS scam_reports (
                    id SERIAL PRIMARY KEY,
                    message_hash VARCHAR(64) UNIQUE NOT NULL,
                    original_message TEXT NOT NULL,
                    url VARCHAR(500),
                    scam_score FLOAT NOT NULL,
                    risk_level VARCHAR(20) NOT NULL,
                    flagged_keywords TEXT[],
                    flagged_urls TEXT[],
                    explanation TEXT NOT NULL,
                    reporter_wallet VARCHAR(42) NOT NULL,
                    reporter_ip VARCHAR(45) NOT NULL,
                    user_agent TEXT,
                    blockchain_tx_hash VARCHAR(66),
                    blockchain_block_number INTEGER,
                    blockchain_confirmed BOOLEAN DEFAULT FALSE,
                    category VARCHAR(30) DEFAULT 'other',
                    status VARCHAR(20) DEFAULT 'pending',
                    report_count INTEGER DEFAULT 1,
                    message_length INTEGER DEFAULT 0,
                    url_count INTEGER DEFAULT 0,
                    keyword_count INTEGER DEFAULT 0,
                    urgency_indicators INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Create indexes
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_scam_reports_message_hash ON scam_reports(message_hash)"))
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_scam_reports_scam_score ON scam_reports(scam_score)"))
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_scam_reports_risk_level ON scam_reports(risk_level)"))
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_scam_reports_created_at ON scam_reports(created_at)"))
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_scam_reports_blockchain_confirmed ON scam_reports(blockchain_confirmed)"))
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_scam_reports_category ON scam_reports(category)"))
            
            # Create users table
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    wallet_address VARCHAR(42) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address)"))
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"))
            
            # Create analytics table
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS analytics (
                    id SERIAL PRIMARY KEY,
                    date DATE NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    metric_data JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date)"))
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics(type)"))
            
            await session.commit()
            logger.info("📋 PostgreSQL tables and indexes created")
            
    except Exception as e:
        logger.error(f"❌ Failed to create PostgreSQL tables: {e}")
        raise

async def close_db():
    """Close database connections"""
    try:
        # Close PostgreSQL connection
        if engine:
            await engine.dispose()
            logger.info("📊 PostgreSQL connection closed")
    except Exception as e:
        logger.error(f"❌ Error closing PostgreSQL: {e}")
