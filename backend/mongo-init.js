// MongoDB initialization script
db = db.getSiblingDB('scamshield');

// Create collections
db.createCollection('scam_reports');
db.createCollection('users');
db.createCollection('analytics');

// Create indexes for better performance
db.scam_reports.createIndex({ "message_hash": 1 }, { unique: true });
db.scam_reports.createIndex({ "scam_score": 1 });
db.scam_reports.createIndex({ "risk_level": 1 });
db.scam_reports.createIndex({ "created_at": -1 });
db.scam_reports.createIndex({ "reporter_wallet": 1 });

db.users.createIndex({ "wallet_address": 1 }, { unique: true });
db.users.createIndex({ "created_at": -1 });

db.analytics.createIndex({ "date": -1 });
db.analytics.createIndex({ "metric_type": 1 });

print('MongoDB initialized successfully');
