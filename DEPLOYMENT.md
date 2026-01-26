# DEPLOYMENT GUIDE - CIXIO Full-Stack Application

Comprehensive deployment instructions for multiple platforms.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Preparation](#environment-preparation)
3. [Heroku Deployment](#heroku-deployment)
4. [AWS Deployment](#aws-deployment)
5. [DigitalOcean Deployment](#digitalocean-deployment)
6. [Docker Deployment](#docker-deployment)
7. [VPS Deployment (Ubuntu)](#vps-deployment-ubuntu)
8. [MongoDB Atlas Setup](#mongodb-atlas-setup)
9. [Domain & SSL Configuration](#domain--ssl-configuration)
10. [Post-Deployment](#post-deployment)
11. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

Before deploying to production, ensure:

### Security

- [ ] Generate strong JWT_SECRET (64+ characters)
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS for production domains only
- [ ] Review and update rate limiting settings
- [ ] Enable MongoDB authentication
- [ ] Remove or secure development endpoints
- [ ] Update all default passwords

### Configuration

- [ ] Set up production MongoDB (Atlas recommended)
- [ ] Configure email service for www.cixio.com
- [ ] Set correct FRONTEND_URL and API_URL
- [ ] Configure ALLOWED_ORIGINS
- [ ] Test all environment variables
- [ ] Verify all API endpoints work

### Code

- [ ] Run tests (if available)
- [ ] Remove console.log statements
- [ ] Minify and optimize assets
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Update dependencies: `npm update`
- [ ] Review error handling
- [ ] Set up logging

### Database

- [ ] Backup local database
- [ ] Set up MongoDB Atlas cluster
- [ ] Configure database indexes
- [ ] Test database connection
- [ ] Set up automated backups

---

## Environment Preparation

### Generate Production JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and save it securely.

### Prepare Production .env

Create a production environment file with these variables:

```env
# =============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# =============================================================================

# Server
NODE_ENV=production
PORT=3000

# Database - MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cixio?retryWrites=true&w=majority

# Security - Use generated secret
JWT_SECRET=<your-64-character-secure-random-key>
JWT_EXPIRE=7d

# Email Service for www.cixio.com
EMAIL_HOST=mail.cixio.com
EMAIL_PORT=587
EMAIL_USER=noreply@cixio.com
EMAIL_PASS=<secure-email-password>
EMAIL_FROM=CIXIO <noreply@cixio.com>
EMAIL_FROM_NAME=CIXIO
EMAIL_FROM_ADDRESS=noreply@cixio.com
SUPPORT_EMAIL=support@cixio.com
INFO_EMAIL=info@cixio.com

# URLs
FRONTEND_URL=https://www.cixio.com
API_URL=https://www.cixio.com/api

# CORS - Production domains only
ALLOWED_ORIGINS=https://www.cixio.com,https://cixio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Security
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_TIME=7200000
PASSWORD_RESET_EXPIRE=3600000
EMAIL_VERIFICATION_EXPIRE=86400000
```

---

## Heroku Deployment

### Step 1: Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu/Debian
curl https://cli-assets.heroku.com/install.sh | sh

# Windows
# Download from: https://devcenter.heroku.com/articles/heroku-cli
```

### Step 2: Login to Heroku

```bash
heroku login
```

### Step 3: Create Heroku App

```bash
cd /path/to/cixio-full-stack
heroku create cixio-app-name

# Or specify region
heroku create cixio-app-name --region eu
```

### Step 4: Add MongoDB

Option 1: Use MongoDB Atlas (Recommended)
```bash
# Set MongoDB Atlas connection string
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/cixio"
```

Option 2: Use Heroku MongoDB Add-on
```bash
heroku addons:create mongolab:sandbox
```

### Step 5: Set Environment Variables

```bash
# Security
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your-64-character-secret"
heroku config:set JWT_EXPIRE="7d"

# Email Configuration
heroku config:set EMAIL_HOST="mail.cixio.com"
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_USER="noreply@cixio.com"
heroku config:set EMAIL_PASS="your-email-password"
heroku config:set EMAIL_FROM="CIXIO <noreply@cixio.com>"
heroku config:set SUPPORT_EMAIL="support@cixio.com"

# URLs
heroku config:set FRONTEND_URL="https://www.cixio.com"
heroku config:set API_URL="https://cixio-app-name.herokuapp.com/api"

# CORS
heroku config:set ALLOWED_ORIGINS="https://www.cixio.com,https://cixio.com"
```

### Step 6: Deploy to Heroku

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Deploy
git push heroku main

# Or if using master branch
git push heroku master
```

### Step 7: Scale Dynos

```bash
heroku ps:scale web=1
```

### Step 8: Open Application

```bash
heroku open
```

### Step 9: View Logs

```bash
heroku logs --tail
```

### Step 10: Custom Domain

```bash
# Add custom domain
heroku domains:add www.cixio.com
heroku domains:add cixio.com

# Get DNS target
heroku domains

# Add CNAME record in your DNS:
# www.cixio.com → CNAME → <heroku-dns-target>
# cixio.com → ALIAS/ANAME → <heroku-dns-target>
```

### Step 11: Enable SSL

```bash
# Automatic SSL (recommended)
heroku certs:auto:enable

# Or upload custom certificate
heroku certs:add server.crt server.key
```

---

## AWS Deployment

### Option 1: AWS Elastic Beanstalk

#### Step 1: Install EB CLI

```bash
pip install awsebcli --upgrade --user
```

#### Step 2: Initialize EB

```bash
cd /path/to/cixio-full-stack
eb init

# Select:
# - Region: us-east-1 (or your preferred region)
# - Application name: cixio-app
# - Platform: Node.js
# - Set up SSH: Yes
```

#### Step 3: Create Environment

```bash
eb create cixio-production

# Or with options
eb create cixio-production \
  --instance-type t2.small \
  --envvars NODE_ENV=production,JWT_SECRET=your-secret
```

#### Step 4: Set Environment Variables

Create `.ebextensions/environment.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
    JWT_SECRET: your-64-character-secret
    JWT_EXPIRE: 7d
    MONGODB_URI: mongodb+srv://user:pass@cluster.mongodb.net/cixio
    EMAIL_HOST: mail.cixio.com
    EMAIL_PORT: 587
    EMAIL_USER: noreply@cixio.com
    EMAIL_PASS: your-password
    EMAIL_FROM: CIXIO <noreply@cixio.com>
    FRONTEND_URL: https://www.cixio.com
    API_URL: https://api.cixio.com
    ALLOWED_ORIGINS: https://www.cixio.com,https://cixio.com
```

#### Step 5: Deploy

```bash
eb deploy
```

#### Step 6: Open Application

```bash
eb open
```

#### Step 7: View Logs

```bash
eb logs
```

### Option 2: AWS EC2

#### Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2
2. Launch Instance:
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: t2.micro (free tier) or t2.small
   - Configure security group:
     - SSH (22) - Your IP
     - HTTP (80) - Anywhere
     - HTTPS (443) - Anywhere
     - Custom TCP (3000) - Anywhere (temporarily)

#### Step 2: Connect to Instance

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### Step 3: Install Node.js

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

#### Step 4: Install MongoDB (Optional - Use Atlas instead)

```bash
# Add MongoDB repository
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Step 5: Clone and Setup Application

```bash
# Install Git
sudo apt install -y git

# Clone repository
git clone https://github.com/admin-cixio/landing1.git
cd landing1

# Install dependencies
npm install --production

# Create .env file
nano .env
# Add production environment variables
```

#### Step 6: Install PM2

```bash
sudo npm install -g pm2
```

#### Step 7: Start Application

```bash
pm2 start server.js --name cixio-api
pm2 save
pm2 startup
```

#### Step 8: Setup Nginx Reverse Proxy

```bash
sudo apt install -y nginx

# Create configuration
sudo nano /etc/nginx/sites-available/cixio
```

Add:
```nginx
server {
    listen 80;
    server_name www.cixio.com cixio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/cixio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 9: Install SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d www.cixio.com -d cixio.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## DigitalOcean Deployment

### Option 1: DigitalOcean App Platform

#### Step 1: Create App

1. Go to DigitalOcean Dashboard
2. Click "Create" → "Apps"
3. Connect your GitHub repository
4. Select branch: `main` or `master`

#### Step 2: Configure App

**Environment Variables:**
```
NODE_ENV=production
PORT=8080
JWT_SECRET=your-secret
MONGODB_URI=mongodb+srv://...
EMAIL_HOST=mail.cixio.com
EMAIL_PORT=587
EMAIL_USER=noreply@cixio.com
EMAIL_PASS=password
FRONTEND_URL=https://www.cixio.com
```

**Build Command:**
```bash
npm install --production
```

**Run Command:**
```bash
npm start
```

#### Step 3: Deploy

Click "Create Resources" and wait for deployment.

#### Step 4: Add Custom Domain

1. Go to Settings → Domains
2. Add: www.cixio.com and cixio.com
3. Update DNS records as shown

### Option 2: DigitalOcean Droplet

#### Step 1: Create Droplet

1. Create → Droplets
2. Choose:
   - Image: Ubuntu 22.04 LTS
   - Plan: Basic ($6/month or higher)
   - Datacenter: Choose closest region
   - Authentication: SSH keys

#### Step 2: Connect

```bash
ssh root@your-droplet-ip
```

#### Step 3: Setup (Same as AWS EC2 Steps 3-9)

Follow AWS EC2 deployment steps 3-9 for complete setup.

---

## Docker Deployment

### Step 1: Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["npm", "start"]
```

### Step 2: Create .dockerignore

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
*.md
.DS_Store
```

### Step 3: Create docker-compose.yml

```yaml
version: '3.8'

services:
  # Application
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGODB_URI=mongodb://mongo:27017/cixio
      - JWT_SECRET=${JWT_SECRET}
      - EMAIL_HOST=${EMAIL_HOST}
      - EMAIL_PORT=${EMAIL_PORT}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASS=${EMAIL_PASS}
      - FRONTEND_URL=${FRONTEND_URL}
    depends_on:
      - mongo
    restart: unless-stopped
    networks:
      - cixio-network

  # MongoDB
  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=secure_password
      - MONGO_INITDB_DATABASE=cixio
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped
    networks:
      - cixio-network

  # Nginx (Optional)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - cixio-network

volumes:
  mongo-data:

networks:
  cixio-network:
    driver: bridge
```

### Step 4: Build and Run

```bash
# Build image
docker build -t cixio-app .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Step 5: Deploy to Docker Registry

```bash
# Tag image
docker tag cixio-app your-registry/cixio-app:latest

# Push to registry
docker push your-registry/cixio-app:latest

# Pull and run on server
docker pull your-registry/cixio-app:latest
docker run -d -p 3000:3000 --env-file .env your-registry/cixio-app:latest
```

---

## VPS Deployment (Ubuntu)

Complete deployment on any VPS (Linode, Vultr, etc.)

### Step 1: Initial Server Setup

```bash
# Connect
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Create non-root user
adduser cixio
usermod -aG sudo cixio

# Setup SSH for new user
su - cixio
mkdir ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste your public key
chmod 600 ~/.ssh/authorized_keys

# Exit and login as new user
exit
ssh cixio@your-vps-ip
```

### Step 2: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 3: Install and Configure Nginx

```bash
sudo apt install -y nginx

# Configure firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### Step 4: Clone and Setup Application

```bash
cd ~
git clone https://github.com/admin-cixio/landing1.git
cd landing1
npm install --production

# Create .env
nano .env
# Add all production variables
```

### Step 5: Install PM2

```bash
sudo npm install -g pm2
pm2 start server.js --name cixio-api
pm2 save
pm2 startup systemd
```

### Step 6: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/cixio
```

Add:
```nginx
server {
    listen 80;
    server_name www.cixio.com cixio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/cixio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Install SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.cixio.com -d cixio.com
```

### Step 8: Setup Automatic Updates

```bash
# Update PM2
pm2 install pm2-logrotate

# Setup auto-deployment
cd ~/landing1
git pull origin main
npm install --production
pm2 restart cixio-api
```

---

## MongoDB Atlas Setup

### Step 1: Create Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Verify email

### Step 2: Create Cluster

1. Click "Build a Cluster"
2. Choose:
   - Free Tier (M0)
   - Cloud Provider: AWS
   - Region: Closest to your users
3. Cluster Name: cixio-cluster
4. Click "Create Cluster"

### Step 3: Setup Database Access

1. Database Access → Add New Database User
2. Authentication Method: Password
3. Username: cixio_admin
4. Password: Generate secure password
5. Database User Privileges: Read and write to any database
6. Add User

### Step 4: Setup Network Access

1. Network Access → Add IP Address
2. Options:
   - Allow Access from Anywhere: 0.0.0.0/0 (development/testing)
   - Add Current IP Address (production)
   - Add specific IPs (recommended for production)
3. Confirm

### Step 5: Get Connection String

1. Clusters → Connect
2. Connect your application
3. Choose driver: Node.js
4. Copy connection string:
```
mongodb+srv://cixio_admin:<password>@cixio-cluster.xxxxx.mongodb.net/cixio?retryWrites=true&w=majority
```
5. Replace `<password>` with your database password
6. Add to `.env`:
```env
MONGODB_URI=mongodb+srv://cixio_admin:your-password@cixio-cluster.xxxxx.mongodb.net/cixio?retryWrites=true&w=majority
```

### Step 6: Test Connection

```bash
node -e "
const mongoose = require('mongoose');
mongoose.connect('your-connection-string')
  .then(() => console.log('✅ Connected'))
  .catch(err => console.error('❌ Error:', err));
"
```

### Step 7: Setup Backups

1. Clusters → ... → Edit Configuration
2. Backup → Cloud Backup
3. Enable Continuous Cloud Backup (paid feature)

---

## Domain & SSL Configuration

### Step 1: Configure DNS

In your domain registrar (GoDaddy, Namecheap, etc.):

**For Heroku:**
```
Type    Name    Value
CNAME   www     your-app.herokuapp.com
ALIAS   @       your-app.herokuapp.com
```

**For AWS/DigitalOcean/VPS:**
```
Type    Name    Value
A       @       your-server-ip
CNAME   www     your-domain.com
```

### Step 2: Wait for DNS Propagation

```bash
# Check DNS
nslookup www.cixio.com
dig www.cixio.com

# Wait 15 minutes to 48 hours
```

### Step 3: Install SSL Certificate

**Free SSL with Let's Encrypt:**
```bash
sudo certbot --nginx -d www.cixio.com -d cixio.com
```

**Or purchase SSL certificate** and install manually.

### Step 4: Verify SSL

```bash
curl -I https://www.cixio.com
```

### Step 5: Force HTTPS

Add to Nginx configuration:
```nginx
server {
    listen 80;
    server_name www.cixio.com cixio.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Post-Deployment

### Step 1: Verify Deployment

```bash
# Health check
curl https://www.cixio.com/api/health

# Test registration
curl -X POST https://www.cixio.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"TestPass123!"}'
```

### Step 2: Monitor Logs

**Heroku:**
```bash
heroku logs --tail
```

**PM2:**
```bash
pm2 logs cixio-api
pm2 monit
```

**Docker:**
```bash
docker-compose logs -f
```

### Step 3: Setup Monitoring

**Tools:**
- Uptime monitoring: Pingdom, UptimeRobot
- Error tracking: Sentry, Rollbar
- Performance: New Relic, Datadog
- Logs: LogDNA, Papertrail

### Step 4: Backup Strategy

1. **Database Backups**:
   - MongoDB Atlas: Automated backups
   - Manual: `mongodump`

2. **Code Backups**:
   - Git repository
   - Regular commits

3. **Environment Variables**:
   - Store securely (password manager)
   - Document all variables

### Step 5: Setup CI/CD

**GitHub Actions Example:**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "cixio-app"
          heroku_email: "your-email@example.com"
```

---

## Monitoring & Maintenance

### Performance Monitoring

```bash
# Check server resources
htop
df -h
free -m

# Check application
pm2 status
pm2 monit

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Security Updates

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm audit
npm audit fix
npm update

# Update PM2
pm2 update
```

### Database Maintenance

```bash
# Check database size
mongo
use cixio
db.stats()

# Backup database
mongodump --uri="your-mongodb-uri" --out=./backup

# Restore database
mongorestore --uri="your-mongodb-uri" ./backup
```

### Log Rotation

```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Troubleshooting Deployment

### Issue: Application Won't Start

**Check:**
```bash
# Verify Node.js version
node --version

# Check logs
pm2 logs cixio-api --lines 100

# Verify environment variables
pm2 env 0

# Test locally
NODE_ENV=production node server.js
```

### Issue: Cannot Connect to MongoDB

**Solutions:**
1. Verify connection string
2. Check network access (whitelist IP in Atlas)
3. Verify credentials
4. Check firewall settings

### Issue: 502 Bad Gateway

**Solutions:**
1. Check if application is running: `pm2 status`
2. Verify Nginx configuration: `sudo nginx -t`
3. Check application port matches Nginx proxy
4. Review application logs

### Issue: SSL Certificate Errors

**Solutions:**
```bash
# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Check certificate
sudo certbot certificates
```

---

## Support & Resources

- **Documentation**: See README.md
- **Support Email**: support@cixio.com
- **GitHub Issues**: https://github.com/admin-cixio/landing1/issues

---

© 2024 CIXIO. All rights reserved.
