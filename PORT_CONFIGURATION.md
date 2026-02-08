# Port Configuration Guide - CIXIO Application

## Overview

This document explains the port configuration for the CIXIO application across different deployment methods.

---

## Port Configuration Summary

### Docker Deployment (Current Setup)

| Service | Internal Port | External Port | Access URL |
|---------|--------------|---------------|------------|
| Node.js App | 80 | 5001 | http://localhost:5001 |
| MongoDB | 27017 | 27017 | mongodb://localhost:27017 (localhost only) |
| Frontend | N/A | 8000 | http://localhost:8000 (development only) |

**Key Points:**
- The app runs on port **80** inside the Docker container
- Port **5001** is exposed to the host machine (configurable in `docker-compose.yml`)
- MongoDB is bound to localhost only for security (`127.0.0.1:27017:27017`)
- The `PORT` environment variable in `.env` should be set to **80** for Docker deployments

### Non-Docker Deployment (Development/VPS)

| Service | Port | Access URL |
|---------|------|------------|
| Node.js App | 3000 (default) | http://localhost:3000 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Frontend | 8000 (optional) | http://localhost:8000 |

**Key Points:**
- The app runs directly on the configured `PORT` (default: 3000)
- All services run on the host machine directly
- Change the `PORT` in `.env` file as needed

---

## Configuration Files

### 1. docker-compose.yml

```yaml
services:
  app:
    ports:
      - "5001:80"  # HOST_PORT:CONTAINER_PORT
```

**To change the external port:**
- Modify `5001` to your desired port
- The internal container port (80) should match the `PORT` in `.env`

### 2. .env Configuration

**For Docker:**
```env
NODE_ENV=production
PORT=80  # Must match the container internal port in docker-compose.yml
MONGODB_URI=mongodb://admin:changeme123@mongo:27017/cixio?authSource=admin
```

**For Non-Docker:**
```env
NODE_ENV=development
PORT=3000  # Can be any available port
MONGODB_URI=mongodb://localhost:27017/cixio
```

### 3. server.js

The server automatically uses the PORT environment variable:
```javascript
const PORT = process.env.PORT || 80;
```

**Default Fallback:**
- Falls back to port **80** if PORT is not set (suitable for Docker)
- Change the fallback to 3000 for non-Docker development if preferred

---

## Deployment-Specific Configurations

### Docker Deployment

**docker-compose.yml:**
```yaml
app:
  ports:
    - "5001:80"  # External:Internal
  environment:
    PORT: 80     # Or via .env file
```

**.env:**
```env
PORT=80
MONGODB_URI=mongodb://admin:changeme123@mongo:27017/cixio?authSource=admin
```

**Access:**
- API: http://localhost:5001
- Health Check: http://localhost:5001/api/health

### Nginx Reverse Proxy (Production)

**For Docker behind Nginx:**
```nginx
server {
    listen 80;
    server_name www.cixio.com cixio.com;

    location / {
        proxy_pass http://localhost:5001;  # Match Docker external port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**For Non-Docker behind Nginx:**
```nginx
server {
    listen 80;
    server_name www.cixio.com cixio.com;

    location / {
        proxy_pass http://localhost:3000;  # Match app PORT
        # ... rest of configuration
    }
}
```

---

## Common Issues & Solutions

### Issue: Cannot connect to API

**Symptom:** Connection refused or timeout errors

**Solution:**
1. Check which deployment method you're using
2. Verify you're using the correct port:
   - Docker: Port **5001** (or configured external port)
   - Non-Docker: Port **3000** (or configured PORT)

**Test:**
```bash
# Docker
curl http://localhost:5001/api/health

# Non-Docker
curl http://localhost:3000/api/health
```

### Issue: Port already in use

**Docker:**
```bash
# Find what's using port 5001
lsof -i :5001        # macOS/Linux
netstat -ano | findstr :5001  # Windows

# Stop Docker container
docker-compose down

# Or change the external port in docker-compose.yml
ports:
  - "5002:80"  # Changed to 5002
```

**Non-Docker:**
```bash
# Find what's using port 3000
lsof -i :3000        # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Change PORT in .env file
PORT=3001
```

### Issue: MongoDB connection failed

**Docker:**
- Inside container, use: `mongodb://mongo:27017/cixio`
- From host machine, use: `mongodb://localhost:27017/cixio`
- With authentication: `mongodb://admin:changeme123@mongo:27017/cixio?authSource=admin`

**Non-Docker:**
- Use: `mongodb://localhost:27017/cixio`
- Or with authentication: `mongodb://admin:changeme123@localhost:27017/cixio?authSource=admin`

---

## Multi-Application Deployment

If running multiple CIXIO instances or applications on the same server:

### Docker Setup

**App 1 (landing1):**
```yaml
# docker-compose.yml
app:
  ports:
    - "5001:80"
```

**App 2 (landing2):**
```yaml
# docker-compose.yml
app:
  ports:
    - "5002:80"
```

**App 3 (landing3):**
```yaml
# docker-compose.yml
app:
  ports:
    - "5003:80"
```

### Nginx Configuration for Multi-App

```nginx
# App 1
server {
    listen 80;
    server_name app1.cixio.com;
    location / {
        proxy_pass http://localhost:5001;
    }
}

# App 2
server {
    listen 80;
    server_name app2.cixio.com;
    location / {
        proxy_pass http://localhost:5002;
    }
}

# App 3
server {
    listen 80;
    server_name app3.cixio.com;
    location / {
        proxy_pass http://localhost:5003;
    }
}
```

---

## Testing Your Configuration

### 1. Check Current Port Configuration

```bash
# View docker-compose.yml ports
grep -A 2 "ports:" docker-compose.yml

# Check .env PORT setting
grep "^PORT=" .env

# Check what's listening
netstat -tulpn | grep -E ':(80|3000|5001)'  # Linux
lsof -i -P | grep -E ':(80|3000|5001)'      # macOS
netstat -ano | findstr "80 3000 5001"      # Windows
```

### 2. Test API Connectivity

```bash
# Docker deployment
curl -v http://localhost:5001/api/health

# Non-Docker deployment
curl -v http://localhost:3000/api/health

# Check response
# Should return: {"status":"ok","message":"CIXIO API is running"}
```

### 3. Verify MongoDB Connection

```bash
# Docker
docker exec -it cixio-com-mongodb mongosh -u admin -p changeme123 --authenticationDatabase admin

# Non-Docker
mongosh mongodb://localhost:27017/cixio
```

---

## Best Practices

1. **Use Environment Variables**: Always configure ports via `.env` file
2. **Document Changes**: Update this file when changing port configurations
3. **Consistent Naming**: Use the branch name pattern that includes port numbers (e.g., `dev_20260208_MultiApplicationPortAllocation`)
4. **Security**: Bind MongoDB to localhost only in production
5. **Load Balancing**: Use Nginx or similar for production deployments
6. **Monitoring**: Set up health checks on the configured ports

---

## Quick Reference

| Deployment Type | App Port | MongoDB Port | Access URL |
|----------------|----------|--------------|------------|
| Docker (Current) | 5001→80 | 127.0.0.1:27017 | http://localhost:5001 |
| Development | 3000 | 27017 | http://localhost:3000 |
| Production (Nginx) | 5001→80 or 3000 | 27017 | https://www.cixio.com |

---

## Additional Resources

- **Docker Compose Documentation**: See `docker-compose.yml` comments
- **Deployment Guide**: See `DEPLOYMENT.md` for production setup
- **Development Guide**: See `DEVELOPMENT.md` for local development
- **Environment Configuration**: See `.env.example` for all variables

---

**Last Updated**: February 8, 2026  
**Branch**: dev_20260208_MultiApplicationPortAllocation
