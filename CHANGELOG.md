# Changelog - CIXIO.COM

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 📝 Documentation
- Centralized all detailed documentation to CIXIO-DOCUMENTS repository
- Maintained README.md in main repository for quick reference

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
