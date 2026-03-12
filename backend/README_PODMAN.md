# Podman Deployment Guide

## Overview

This guide explains how to deploy the ScamShield AI backend using Podman and Podman Compose.

## Prerequisites

- Podman and Podman Compose installed
- At least 4GB RAM available
- 10GB free disk space

## Installation

### Install Podman (Fedora/CentOS/RHEL)
```bash
sudo dnf install podman podman-compose
```

### Install Podman (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install podman podman-compose
```

### Install Podman (macOS)
```bash
brew install podman
podman machine init
podman machine start
```

## Quick Start

### Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Start development environment
podman-compose -f podman-compose.dev.yml up -d

# View logs
podman-compose -f podman-compose.dev.yml logs -f backend

# Stop services
podman-compose -f podman-compose.dev.yml down
```

### Production Environment

```bash
# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Start production environment
podman-compose -f podman-compose.prod.yml up -d

# View logs
podman-compose -f podman-compose.prod.yml logs -f backend

# Stop services
podman-compose -f podman-compose.prod.yml down
```

## Build Container Manually

```bash
# Build the container
podman build -t scamshield-backend:latest -f Containerfile .

# Run the container
podman run -d \
  --name scamshield-backend \
  -p 8000:8000 \
  -e MONGODB_URI=mongodb://localhost:27017/scamshield \
  -e REDIS_URL=redis://localhost:6379 \
  scamshield-backend:latest
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

## Containerfile Features

- **Multi-stage build**: Optimized for size
- **Non-root user**: Security best practice
- **Health checks**: Automatic monitoring
- **Caching**: Efficient layer caching
- **Security headers**: Built-in security

## Monitoring

### Health Checks
```bash
# Check container health
podman ps

# Check service logs
podman-compose logs <service-name>

# Monitor resource usage
podman stats
```

### Database Access
```bash
# Connect to MongoDB
podman exec -it scamshield-mongodb mongosh scamshield

# Connect to Redis
podman exec -it scamshield-redis redis-cli
```

## Podman-Specific Features

### Rootless Containers
Podman runs containers without root privileges by default, enhancing security.

### Systemd Integration
```bash
# Generate systemd service files
podman generate systemd --name scamshield-backend --files --new

# Enable and start service
sudo cp container-scamshield-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable container-scamshield-backend.service
sudo systemctl start container-scamshield-backend.service
```

### Pod Management
```bash
# Create a pod for related containers
podman pod create --name scamshield-pod -p 8000:8000 -p 27017:27017 -p 6379:6379

# Add containers to pod
podman run -d --pod scamshield-pod --name mongodb mongo:7.0
podman run -d --pod scamshield-pod --name redis redis:7.2-alpine
podman run -d --pod scamshield-pod --name backend scamshield-backend:latest
```

## Scaling

### Horizontal Scaling
```bash
# Scale backend service
podman-compose -f podman-compose.prod.yml up -d --scale backend=3
```

### Load Balancing
Nginx automatically load balances between multiple backend instances.

## Backup and Recovery

### MongoDB Backup
```bash
# Create backup
podman exec scamshield-mongodb mongodump --out /backup

# Copy to host
podman cp scamshield-mongodb:/backup ./backup
```

### Redis Backup
```bash
# Create backup
podman exec scamshield-redis redis-cli BGSAVE

# Copy to host
podman cp scamshield-redis:/data/dump.rdb ./redis-backup.rdb
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in podman-compose file
2. **Permission issues**: Ensure proper file permissions
3. **Memory issues**: Increase Podman memory limit
4. **Network issues**: Check firewall settings

### Debug Commands
```bash
# Check container logs
podman logs <container-name>

# Enter container shell
podman exec -it <container-name> /bin/bash

# Check network connectivity
podman network ls
podman network inspect <network-name>

# Check container inspection
podman inspect <container-name>
```

## Performance Optimization

### Production Optimizations
- Use SSD storage for better I/O
- Configure Redis persistence
- Enable MongoDB compression
- Monitor memory usage
- Set up log rotation

### Podman Optimizations
- Use .dockerignore to reduce build context
- Enable BuildKit for faster builds
- Use specific image versions
- Implement health checks
- Use rootless containers

## Security Considerations

- Use strong passwords and secrets
- Enable SSL/TLS in production
- Regularly update base images
- Implement rate limiting
- Monitor access logs
- Use rootless containers

## Differences from Docker

1. **Rootless by default**: Enhanced security
2. **No daemon**: Direct container management
3. **Systemd integration**: Better service management
4. **Pods**: Native support for container groups
5. **Compatibility**: Docker-compatible CLI

## Support

For issues related to:
- Podman: Check Podman documentation
- Application: Review application logs
- Database: Consult MongoDB/Redis docs
- Networking: Check Podman networking docs
