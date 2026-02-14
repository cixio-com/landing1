# Changelog - CIXIO.COM

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 📝 Documentation
- Centralized all detailed documentation to CIXIO-DOCUMENTS repository
- Maintained README.md in main repository for quick reference

---

## [2.1.0] - 2026-02-14

### ✨ Added
- **Multi-Environment Deployment Support**
  - `docker-compose.stage.yml` - Stage server configuration (remote MongoDB)
  - `docker-compose.production.yml` - Production server configuration (local MongoDB)
  - `.env.stage.example` - Stage environment template
  - `.env.production.example` - Production environment template
  - `DEPLOYMENT_GUIDE.md` - Comprehensive deployment documentation

### 🔄 Changed
- **docker-compose.yml** - Removed external network dependency from default config
- **deploy.sh** - Auto-detects and uses environment-specific compose files
- **deploy-on-server.sh** - Intelligently selects compose file based on NODE_ENV

### 🐛 Fixed
- **Stage Server Deployment** - Fixed "external network not found" error
- **Multi-Server MongoDB** - Stage now connects to remote MongoDB via VPC IP
- **Network Configuration** - Removed unnecessary network dependencies

### 📋 Technical Details
- **Stage**: Connects to remote MongoDB (172.31.33.96) via VPC private IP
- **Production**: Connects to local MongoDB containers via Docker network
- Automatic environment detection from `.env` file
- Proper network configuration for each deployment type

### 🔧 Migration Required
- Update `.env` file with `DEPLOY_TARGET=stage` or `DEPLOY_TARGET=production`
- Use environment-specific templates: `.env.stage.example` or `.env.production.example`
- See `DEPLOYMENT_GUIDE.md` for detailed migration instructions

---

## [2.0.0] - 2026-02-08

### ✨ Added
- Professional email service integration
- Enhanced newsletter functionality
- Email verification (double opt-in)
- Account lockout after failed login attempts
- Rate limiting and DDoS protection
- Activity logging system

### 🔄 Changed
- Improved Docker deployment configuration
- Standardized environment variable structure
- Updated authentication flow with JWT
- Enhanced security with bcrypt (12 rounds)

### 🐛 Fixed
- Newsletter subscription issues
- Email delivery problems
- SMTP configuration errors
- Environment variable loading

### 📦 Dependencies
- Updated Express.js
- Updated Mongoose
- Updated bcrypt
- Added nodemailer for email service

---

## [1.x.x] - Previous Versions

### Features
- Basic user authentication
- Contact form
- Newsletter subscription
- MongoDB integration
- Express.js REST API

---

## 📋 Update Guidelines

When making changes, update this file with:

1. **Version Number**: Follow semantic versioning
2. **Date**: YYYY-MM-DD format
3. **Category**: Added, Changed, Deprecated, Removed, Fixed, Security
4. **Description**: Clear, concise description of changes

### Categories:
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes

---

## 🔗 Links

- [Documentation](../CIXIO-DOCUMENTS/mvp11_cixio-documents/cixio-com/)
- [Deployment Guide](../CIXIO-DOCUMENTS/mvp11_cixio-documents/cixio-com/deployment/)
- [Setup Guide](../CIXIO-DOCUMENTS/mvp11_cixio-documents/cixio-com/setup/)

---

**Last Updated**: February 11, 2026
