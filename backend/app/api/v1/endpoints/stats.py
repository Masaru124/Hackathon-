from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging

from app.schemas.scam import StatsResponse
from app.core.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/overview", response_model=StatsResponse)
async def get_overview_stats():
    """Get overall statistics"""
    try:
        db = await get_db()
        
        # Overall statistics
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "totalReports": {"$sum": 1},
                    "averageScore": {"$avg": "$scam_score"},
                    "highRiskCount": {
                        "$sum": {"$cond": [{"$gte": ["$scam_score", 80]}, 1, 0]}
                    },
                    "confirmedCount": {
                        "$sum": {"$cond": ["$blockchain_confirmed", 1, 0]}
                    }
                }
            }
        ]
        
        overall_result = await db.scam_reports.aggregate(pipeline).to_list(length=1)
        overall = overall_result[0] if overall_result else {
            "totalReports": 0,
            "averageScore": 0,
            "highRiskCount": 0,
            "confirmedCount": 0
        }
        
        # Category statistics
        category_pipeline = [
            {
                "$group": {
                    "_id": "$category",
                    "count": {"$sum": 1},
                    "avgScore": {"$avg": "$scam_score"}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        category_stats = await db.scam_reports.aggregate(category_pipeline).to_list(length=None)
        
        # Recent trend (last 7 days)
        trend_pipeline = [
            {
                "$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.date": -1}},
            {"$limit": 7}
        ]
        
        recent_trend = await db.scam_reports.aggregate(trend_pipeline).to_list(length=None)
        
        return StatsResponse(
            success=True,
            data={
                "overall": overall,
                "byCategory": category_stats,
                "recentTrend": recent_trend,
                "lastUpdated": datetime.utcnow().isoformat()
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Stats overview error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(e)}")

@router.get("/trends")
async def get_trends(days: int = 30):
    """Get scam trends over time"""
    try:
        db = await get_db()
        
        # Daily trends
        daily_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": datetime.utcnow() - timedelta(days=days)}
                }
            },
            {
                "$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}
                    },
                    "totalReports": {"$sum": 1},
                    "avgScore": {"$avg": "$scam_score"},
                    "highRiskCount": {
                        "$sum": {"$cond": [{"$gte": ["$scam_score", 80]}, 1, 0]}
                    },
                    "blockchainConfirmed": {
                        "$sum": {"$cond": ["$blockchain_confirmed", 1, 0]}
                    }
                }
            },
            {"$sort": {"_id.date": 1}}
        ]
        
        daily_trends = await db.scam_reports.aggregate(daily_pipeline).to_list(length=None)
        
        # Hourly trends for last 24 hours
        hourly_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": datetime.utcnow() - timedelta(hours=24)}
                }
            },
            {
                "$group": {
                    "_id": {"$hour": "$created_at"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        hourly_trends = await db.scam_reports.aggregate(hourly_pipeline).to_list(length=None)
        
        return StatsResponse(
            success=True,
            data={
                "dailyTrends": daily_trends,
                "hourlyTrends": hourly_trends,
                "period": f"{days} days"
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Trends error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch trends: {str(e)}")

@router.get("/categories")
async def get_categories():
    """Get statistics by category"""
    try:
        db = await get_db()
        
        # Category statistics
        category_pipeline = [
            {
                "$group": {
                    "_id": "$category",
                    "count": {"$sum": 1},
                    "avgScore": {"$avg": "$scam_score"},
                    "highRiskCount": {
                        "$sum": {"$cond": [{"$gte": ["$scam_score", 80]}, 1, 0]}
                    },
                    "blockchainConfirmed": {
                        "$sum": {"$cond": ["$blockchain_confirmed", 1, 0]}
                    }
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        category_stats = await db.scam_reports.aggregate(category_pipeline).to_list(length=None)
        
        # Top keywords by category
        keywords_pipeline = [
            {"$unwind": "$flagged_keywords"},
            {
                "$group": {
                    "_id": {
                        "category": "$category",
                        "keyword": "$flagged_keywords"
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}},
            {
                "$group": {
                    "_id": "$_id.category",
                    "topKeywords": {"$push": {"keyword": "$_id.keyword", "count": "$count"}}
                }
            },
            {
                "$project": {
                    "category": "$_id",
                    "topKeywords": {"$slice": ["$topKeywords", 5]}
                }
            }
        ]
        
        top_keywords_by_category = await db.scam_reports.aggregate(keywords_pipeline).to_list(length=None)
        
        return StatsResponse(
            success=True,
            data={
                "categoryStats": category_stats,
                "topKeywordsByCategory": top_keywords_by_category
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Categories stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch category statistics: {str(e)}")

@router.get("/urls")
async def get_url_stats():
    """Get URL statistics"""
    try:
        db = await get_db()
        
        # Top URLs
        url_pipeline = [
            {"$match": {"url": {"$ne": None, "$ne": ""}}},
            {
                "$group": {
                    "_id": "$url",
                    "count": {"$sum": 1},
                    "avgScore": {"$avg": "$scam_score"},
                    "firstSeen": {"$min": "$created_at"},
                    "lastSeen": {"$max": "$created_at"}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 20}
        ]
        
        top_urls = await db.scam_reports.aggregate(url_pipeline).to_list(length=None)
        
        # Domain analysis
        domain_pipeline = [
            {"$match": {"url": {"$ne": None, "$ne": ""}}},
            {
                "$addFields": {
                    "domain": {
                        "$arrayElemAt": [
                            {"$split": [{"$replaceAll": {"input": "$url", "find": "https://", "replacement": ""}}, "/"]},
                            0
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$domain",
                    "count": {"$sum": 1},
                    "avgScore": {"$avg": "$scam_score"},
                    "uniqueUrls": {"$addToSet": "$url"}
                }
            },
            {
                "$project": {
                    "domain": "$_id",
                    "count": 1,
                    "avgScore": 1,
                    "uniqueUrlCount": {"$size": "$uniqueUrls"}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 15}
        ]
        
        top_domains = await db.scam_reports.aggregate(domain_pipeline).to_list(length=None)
        
        return StatsResponse(
            success=True,
            data={
                "topUrls": top_urls,
                "topDomains": top_domains
            }
        )
        
    except Exception as e:
        logger.error(f"❌ URL stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch URL statistics: {str(e)}")

@router.get("/reporters")
async def get_reporter_stats():
    """Get top reporters statistics"""
    try:
        db = await get_db()
        
        reporter_pipeline = [
            {
                "$group": {
                    "_id": "$reporter_wallet",
                    "totalReports": {"$sum": 1},
                    "avgScore": {"$avg": "$scam_score"},
                    "highRiskReports": {
                        "$sum": {"$cond": [{"$gte": ["$scam_score", 80]}, 1, 0]}
                    },
                    "blockchainConfirmed": {
                        "$sum": {"$cond": ["$blockchain_confirmed", 1, 0]}
                    },
                    "firstReport": {"$min": "$created_at"},
                    "lastReport": {"$max": "$created_at"},
                    "categories": {"$addToSet": "$category"}
                }
            },
            {"$match": {"totalReports": {"$gte": 2}}},
            {"$sort": {"totalReports": -1}},
            {"$limit": 20},
            {
                "$project": {
                    "walletAddress": "$_id",
                    "totalReports": 1,
                    "avgScore": 1,
                    "highRiskReports": 1,
                    "blockchainConfirmed": 1,
                    "firstReport": 1,
                    "lastReport": 1,
                    "categoryCount": {"$size": "$categories"}
                }
            }
        ]
        
        top_reporters = await db.scam_reports.aggregate(reporter_pipeline).to_list(length=None)
        
        return StatsResponse(
            success=True,
            data={
                "topReporters": top_reporters
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Reporters stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch reporter statistics: {str(e)}")

@router.get("/blockchain")
async def get_blockchain_stats():
    """Get blockchain statistics"""
    try:
        db = await get_db()
        
        # Confirmation statistics
        confirmation_pipeline = [
            {
                "$group": {
                    "_id": "$blockchain_confirmed",
                    "count": {"$sum": 1},
                    "avgScore": {"$avg": "$scam_score"}
                }
            }
        ]
        
        confirmation_stats = await db.scam_reports.aggregate(confirmation_pipeline).to_list(length=None)
        
        # Recent confirmed reports
        recent_confirmed = await db.scam_reports.find(
            {"blockchain_confirmed": True}
        ).sort("blockchain_block_number", -1).limit(10).to_list(length=None)
        
        # Pending reports
        pending_reports = await db.scam_reports.find(
            {"blockchain_confirmed": False}
        ).sort("created_at", -1).limit(10).to_list(length=None)
        
        # Convert ObjectId to string
        for report in recent_confirmed + pending_reports:
            report["_id"] = str(report["_id"])
        
        return StatsResponse(
            success=True,
            data={
                "confirmationStats": confirmation_stats,
                "recentConfirmed": recent_confirmed,
                "pendingConfirmation": pending_reports
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Blockchain stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch blockchain statistics: {str(e)}")

# Import required modules
from datetime import datetime, timedelta
