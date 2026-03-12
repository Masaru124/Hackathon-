# Docker Deployment Guide

## Overview

This guide explains how to deploy the ScamShield AI backend using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- 10GB free disk space

## Quick Start

### Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production Environment

```bash
# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## Services

### Backend
- **Port**: 8000
- **Health Check**: `/api/v1/scam/scan`
- **Environment Variables**: See `.env.example`

### MongoDB
- **Port**: 27017
- **Database**: `scamshield`
- **Data Persistence**: Yes

### Redis
- **Port**: 6379
- **Data Persistence**: Yes

### Nginx (Production Only)
- **Ports**: 80, 443
- **Rate Limiting**: Configured
- **SSL**: Ready for certificates

### Mongo Express (Development Only)
- **Port**: 8081
- **URL**: http://localhost:8081
- **Credentials**: admin/admin

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
MONGODB_URI=mongodb://mongodb:27017/scamshield
REDIS_URL=redis://redis:6379

# Blockchain
BLOCKCHAIN_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_INFURA_PROJECT_ID
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000000
PRIVATE_KEY=your_private_key_here

# Security
JWT_SECRET_KEY=your_jwt_secret_key_here

# Environment
ENVIRONMENT=production
```

## Dockerfile Features

- **Multi-stage build**: Optimized for size
- **Non-root user**: Security best practice
- **Health checks**: Automatic monitoring
- **Caching**: Efficient layer caching
- **Security headers**: Built-in security

## Monitoring

### Health Checks
```bash
# Check container health
docker ps

# Check service logs
docker-compose logs <service-name>

# Monitor resource usage
docker stats
```

### Database Access
```bash
# Connect to MongoDB
docker exec -it scamshield-mongodb mongosh scamshield

# Connect to Redis
docker exec -it scamshield-redis redis-cli
```

## SSL Configuration (Production)

1. Place SSL certificates in `./ssl/` directory:
   - `cert.pem` - SSL certificate
   - `key.pem` - Private key

2. Uncomment HTTPS section in `nginx.conf`

3. Update server_name in nginx.conf

## Scaling

### Horizontal Scaling
```bash
# Scale backend service
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Load Balancing
Nginx automatically load balances between multiple backend instances.

## Backup and Recovery

### MongoDB Backup
```bash
# Create backup
docker exec scamshield-mongodb mongodump --out /backup

# Copy to host
docker cp scamshield-mongodb:/backup ./backup
```

### Redis Backup
```bash
# Create backup
docker exec scamshield-redis redis-cli BGSAVE

# Copy to host
docker cp scamshield-redis:/data/dump.rdb ./redis-backup.rdb
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose file
2. **Permission issues**: Ensure proper file permissions
3. **Memory issues**: Increase Docker memory limit
4. **Network issues**: Check firewall settings

### Debug Commands
```bash
# Check container logs
docker logs <container-name>

# Enter container shell
docker exec -it <container-name> /bin/bash

# Check network connectivity
docker network ls
docker network inspect <network-name>
```

## Performance Optimization

### Production Optimizations
- Use SSD storage for better I/O
- Configure Redis persistence
- Enable MongoDB compression
- Monitor memory usage
- Set up log rotation

### Docker Optimizations
- Use .dockerignore to reduce build context
- Enable BuildKit for faster builds
- Use specific image versions
- Implement health checks

## Security Considerations

- Use strong passwords and secrets
- Enable SSL/TLS in production
- Regularly update base images
- Implement rate limiting
- Monitor access logs
- Use non-root containers

## Support

For issues related to:
- Docker: Check Docker documentation
- Application: Review application logs
- Database: Consult MongoDB/Redis docs
- Networking: Check Docker networking docs
