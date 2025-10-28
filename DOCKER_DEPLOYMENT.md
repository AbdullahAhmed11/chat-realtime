# Docker Deployment Guide

This guide explains how to deploy the Real-Time Team Chat application using Docker and Docker Compose.

## Prerequisites

- Docker Desktop installed (https://www.docker.com/products/docker-desktop)
- At least 4GB of available RAM
- Internet connection for pulling images

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd realtime-chat
```

### 2. Configure Environment Variables

The `docker-compose.yml` file includes default environment variables. For production, you should modify them:

**Important**: Change the JWT_SECRET in `docker-compose.yml`:
```yaml
environment:
  - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Start All Services

```bash
docker-compose up -d
```

This command will:
- Pull required images (MongoDB, Node, Nginx)
- Build backend and frontend containers
- Start all services in the background
- Create persistent volume for MongoDB data

### 4. Check Service Status

```bash
docker-compose ps
```

Expected output:
```
NAME                        STATUS              PORTS
realtime-chat-backend       Up and running      0.0.0.0:4000->4000/tcp
realtime-chat-frontend      Up and running      0.0.0.0:80->80/tcp
realtime-chat-mongodb       Up and running      0.0.0.0:27017->27017/tcp
```

### 5. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:4000
- **MongoDB**: localhost:27017

## Service Details

### Services Architecture

```
┌─────────────────┐
│   Frontend      │ (Port 80)
│   (Nginx)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │ (Port 4000)
│   (Node.js)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MongoDB       │ (Port 27017)
│   (Database)    │
└─────────────────┘
```

### MongoDB
- Image: `mongo:7`
- Port: `27017`
- Data persistence: Volume `mongodb_data`
- Access: Can be accessed directly for migrations/backups

### Backend API
- Image: Custom build from `backend/Dockerfile`
- Port: `4000`
- Environment: Production
- Dependencies: Requires MongoDB to be running

### Frontend
- Image: Custom build from `frontend/Dockerfile`
- Port: `80`
- Server: Nginx with optimized configuration
- Cache headers: Enabled for static assets
- SPA support: React Router configured

## Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Stop Services
```bash
docker-compose stop
```

### Start Services (after stop)
```bash
docker-compose start
```

### Restart a Service
```bash
docker-compose restart backend
```

### Rebuild After Code Changes
```bash
# Rebuild and restart specific service
docker-compose up -d --build backend

# Rebuild all services
docker-compose up -d --build
```

### Remove Everything (⚠️ This deletes all data)
```bash
docker-compose down -v
```

## Production Deployment

### 1. Update Configuration

Edit `docker-compose.yml` for production settings:

```yaml
backend:
  environment:
    - JWT_SECRET=<generate-strong-random-secret>
    - NODE_ENV=production
    # Update MongoDB URI if using external DB
    - MONGODB_URI=mongodb://mongodb:27017/realtime-chat
```

### 2. Security Considerations

**For Production:**
- [ ] Change JWT_SECRET to a secure random string
- [ ] Use environment-specific config files
- [ ] Enable HTTPS with reverse proxy (e.g., Traefik, nginx-proxy)
- [ ] Set up proper CORS origins
- [ ] Use MongoDB Atlas or managed database
- [ ] Enable MongoDB authentication
- [ ] Set resource limits for containers
- [ ] Enable log rotation
- [ ] Use Docker secrets for sensitive data

### 3. Resource Limits

Add to `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 4. Reverse Proxy Setup (HTTPS)

Use a reverse proxy like nginx or Traefik:

```nginx
# nginx.conf for reverse proxy
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
    }
    
    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
    }
    
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Database Management

### Backup MongoDB Data
```bash
docker exec realtime-chat-mongodb mongodump --out /backup
docker cp realtime-chat-mongodb:/backup ./mongodb-backup
```

### Restore MongoDB Data
```bash
docker cp ./mongodb-backup realtime-chat-mongodb:/restore
docker exec realtime-chat-mongodb mongorestore /restore
```

### Access MongoDB Shell
```bash
docker exec -it realtime-chat-mongodb mongosh
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose logs

# Check if ports are in use
lsof -i :4000
lsof -i :80
```

### Database Connection Issues
```bash
# Check if MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify network connectivity
docker exec realtime-chat-backend ping mongodb
```

### Frontend Not Loading
```bash
# Check if nginx is serving files
docker exec realtime-chat-frontend ls -la /usr/share/nginx/html

# Check nginx logs
docker exec realtime-chat-frontend cat /var/log/nginx/error.log
```

### Rebuild Everything
```bash
# Stop and remove containers
docker-compose down

# Remove volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

## Monitoring

### Check Resource Usage
```bash
docker stats
```

### View Container Details
```bash
docker inspect realtime-chat-backend
```

### Health Checks
Add health checks to `docker-compose.yml`:
```yaml
backend:
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

## Scaling

To scale the backend service:
```bash
docker-compose up -d --scale backend=3
```

Note: With multiple backend instances, you'll need to use Redis adapter for Socket.IO (not included in basic setup).

## Cleanup

### Remove All Containers and Volumes
```bash
docker-compose down -v
```

### Remove Docker Images
```bash
docker-compose down --rmi all
```

## Deployment Timeline

For a typical production deployment:

1. **Development Environment** (1 hour)
   - Set up docker-compose
   - Configure local environment
   - Test all features

2. **Staging Deployment** (2-3 hours)
   - Configure production-like settings
   - Set up HTTPS/SSL
   - Test with real users

3. **Production Deployment** (4-6 hours)
   - Infrastructure setup (server/cloud)
   - Domain configuration
   - SSL certificate installation
   - Monitoring setup
   - Backup configuration
   - Load testing

4. **Post-Deployment** (Ongoing)
   - Monitor logs and performance
   - User testing
   - Issue resolution
   - Regular backups

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Nginx Documentation](https://nginx.org/en/docs/)


