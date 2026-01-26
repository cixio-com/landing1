# DEVELOPMENT GUIDE - CIXIO Full-Stack Application

Complete guide for developers working on the CIXIO application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Development Setup](#development-setup)
5. [Code Style & Standards](#code-style--standards)
6. [Database Models](#database-models)
7. [API Routes](#api-routes)
8. [Authentication & Authorization](#authentication--authorization)
9. [Email System](#email-system)
10. [Security Features](#security-features)
11. [Testing](#testing)
12. [Contributing Guidelines](#contributing-guidelines)

---

## Architecture Overview

CIXIO follows a modern **MVC (Model-View-Controller)** architecture pattern with clear separation of concerns.

```
┌─────────────┐
│   Client    │ (Frontend - Static HTML/JS)
│  (Browser)  │
└──────┬──────┘
       │ HTTP/HTTPS
       ▼
┌─────────────┐
│   Nginx     │ (Reverse Proxy - Optional)
│ (Port 80/   │
│    443)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Express   │ (API Server)
│  (Port 3000)│
│             │
│  ┌────────┐ │
│  │ Routes │ │ → API Endpoints
│  └────┬───┘ │
│       │     │
│  ┌────▼───────┐
│  │Controllers│ │ → Business Logic
│  └────┬───────┘
│       │     │
│  ┌────▼──────┐
│  │ Models    │ │ → Data Models
│  └────┬──────┘
│       │     │
└───────┼─────┘
        │
        ▼
┌─────────────┐
│  MongoDB    │ (Database)
│ (Port 27017)│
└─────────────┘
```

### Key Components

1. **Server Layer** (`server.js`)
   - Express.js application initialization
   - Middleware configuration
   - Route mounting
   - Database connection
   - Error handling

2. **Routes Layer** (`src/routes/`)
   - API endpoint definitions
   - Request validation
   - Route-level middleware

3. **Controllers Layer** (`src/controllers/`)
   - Business logic implementation
   - Request/response handling
   - Service orchestration

4. **Models Layer** (`src/models/`)
   - Database schema definitions
   - Data validation
   - Model methods and virtuals

5. **Middleware Layer** (`src/middleware/`)
   - Authentication
   - Authorization
   - Validation
   - Error handling

6. **Utilities Layer** (`src/utils/`)
   - Helper functions
   - Email service
   - JWT utilities
   - Validators

---

## Project Structure

```
cixio-full-stack/
│
├── server.js                    # Main application entry point
├── package.json                 # Dependencies and scripts
├── .env                         # Environment variables (not in repo)
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
│
├── src/                         # Source code
│   ├── config/                  # Configuration files
│   │   ├── database.config.js   # MongoDB configuration
│   │   └── email.config.js      # Email service configuration
│   │
│   ├── models/                  # Mongoose models (4 models)
│   │   ├── user.model.js        # User schema and methods
│   │   ├── subscription.model.js # Subscription schema
│   │   ├── contact.model.js     # Contact form schema
│   │   └── newsletter.model.js  # Newsletter subscriber schema
│   │
│   ├── routes/                  # Express routes (5 route files, 22+ endpoints)
│   │   ├── auth.routes.js       # Authentication routes (7 endpoints)
│   │   ├── user.routes.js       # User management (4 endpoints)
│   │   ├── subscription.routes.js # Subscriptions (8 endpoints)
│   │   ├── contact.routes.js    # Contact forms (8 endpoints)
│   │   └── newsletter.routes.js # Newsletter (9 endpoints)
│   │
│   ├── controllers/             # Request handlers
│   │   ├── auth.controller.js   # Authentication logic
│   │   ├── user.controller.js   # User management logic
│   │   ├── subscription.controller.js
│   │   ├── contact.controller.js
│   │   └── newsletter.controller.js
│   │
│   ├── middleware/              # Custom middleware
│   │   ├── auth.middleware.js   # JWT authentication
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js  # Error handling
│   │
│   ├── utils/                   # Utility functions
│   │   ├── jwt.utils.js         # JWT generation/verification
│   │   ├── email.utils.js       # Email sending
│   │   ├── validation.utils.js  # Input validation
│   │   └── crypto.utils.js      # Encryption utilities
│   │
│   └── emails/                  # Email templates (7 templates)
│       ├── templates/
│       │   ├── welcome.html              # New user welcome
│       │   ├── email-verification.html   # Email verification
│       │   ├── password-reset.html       # Password reset
│       │   ├── subscription-confirmation.html
│       │   ├── newsletter-verification.html
│       │   ├── contact-acknowledgment.html
│       │   └── contact-response.html
│       ├── subscription-confirmation.html
│       ├── subscription-cancellation.html
│       └── subscription-renewal.html
│
├── public/                      # Static frontend files
│   ├── index.html              # Main HTML
│   ├── css/                    # Stylesheets
│   ├── js/                     # JavaScript files
│   └── assets/                 # Images, fonts, etc.
│
├── tests/                       # Test files (future)
│   ├── unit/
│   └── integration/
│
└── docs/                        # Documentation
    ├── START_HERE.txt
    ├── GET_STARTED.md
    ├── QUICK_REFERENCE.md
    ├── DEPLOYMENT.md
    ├── DEVELOPMENT.md           # This file
    └── IMPLEMENTATION_CHECKLIST.txt
```

---

## Technology Stack

### Backend

- **Runtime**: Node.js (v14+)
- **Framework**: Express.js (v4.18+)
- **Database**: MongoDB (v4.4+) with Mongoose ODM (v7.6+)
- **Authentication**: JWT (jsonwebtoken v9.0+)
- **Password Hashing**: bcryptjs (v2.4+)
- **Email**: Nodemailer (v6.9+)
- **Security**: 
  - Helmet.js (v7.1+) - Security headers
  - CORS (v2.8+) - Cross-origin resource sharing
  - express-rate-limit (v7.1+) - Rate limiting
  - Validator (v13.11+) - Input validation

### Development Tools

- **Process Manager**: PM2 (production)
- **Development Server**: Nodemon (development)
- **Version Control**: Git
- **Package Manager**: npm

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Bootstrap (optional)

---

## Development Setup

### Prerequisites

```bash
node --version   # v14.0.0 or higher
npm --version    # v6.0.0 or higher
mongod --version # v4.4 or higher
```

### Initial Setup

1. **Clone Repository**
```bash
git clone https://github.com/admin-cixio/landing1.git
cd landing1
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Start MongoDB**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

5. **Run Development Server**
```bash
npm run dev
```

### Development Workflow

1. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**
```bash
# Edit files
# Test locally
```

3. **Test Changes**
```bash
# Manual testing
curl http://localhost:3000/api/health

# Run tests (when available)
npm test
```

4. **Commit Changes**
```bash
git add .
git commit -m "feat: add new feature"
```

5. **Push and Create Pull Request**
```bash
git push origin feature/your-feature-name
```

---

## Code Style & Standards

### Naming Conventions

**Files:**
- Models: `model-name.model.js` (e.g., `user.model.js`)
- Routes: `route-name.routes.js` (e.g., `auth.routes.js`)
- Controllers: `controller-name.controller.js`
- Utilities: `utility-name.utils.js`

**Variables:**
- camelCase for variables and functions
- PascalCase for classes and models
- UPPER_SNAKE_CASE for constants

```javascript
// Good
const userEmail = 'user@example.com';
const MAX_LOGIN_ATTEMPTS = 5;
class UserModel { }

// Avoid
const user_email = 'user@example.com';
const maxLoginAttempts = 5;
```

**Functions:**
```javascript
// Use descriptive names
async function getUserById(userId) { }
async function sendVerificationEmail(user) { }

// Avoid single letters (except in loops)
async function g(u) { } // Bad
```

### Code Structure

**Controllers:**
```javascript
const controllerFunction = async (req, res) => {
    try {
        // 1. Extract and validate input
        const { param1, param2 } = req.body;
        
        // 2. Business logic
        const result = await someOperation(param1, param2);
        
        // 3. Send response
        return res.status(200).json({
            success: true,
            message: 'Operation successful',
            data: result
        });
    } catch (error) {
        console.error('Error in controllerFunction:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};
```

**Models:**
```javascript
const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
    // Fields with validation
    fieldName: {
        type: String,
        required: [true, 'Field is required'],
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
modelSchema.index({ fieldName: 1 });

// Methods
modelSchema.methods.customMethod = function() {
    // Method logic
};

// Statics
modelSchema.statics.staticMethod = async function() {
    // Static method logic
};

module.exports = mongoose.model('ModelName', modelSchema);
```

### Error Handling

**Always use try-catch:**
```javascript
try {
    // Operation
} catch (error) {
    console.error('Error description:', error);
    return res.status(500).json({
        success: false,
        message: 'User-friendly error message'
    });
}
```

**Use descriptive error messages:**
```javascript
// Good
throw new Error('User not found with provided email');

// Avoid
throw new Error('Error');
```

### Comments

```javascript
/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} User profile data
 */
const getProfile = async (req, res) => {
    // Implementation
};

// Comment complex logic
// Calculate engagement score: 60% open rate + 40% click rate
const engagementScore = (openRate * 0.6) + (clickRate * 0.4);
```

---

## Database Models

### 1. User Model

**File**: `src/models/user.model.js`

**Schema Fields:**
- Basic Info: firstName, lastName, email, mobile, password
- Verification: isEmailVerified, emailVerificationToken, emailVerificationExpires
- Security: isActive, isLocked, lockUntil, loginAttempts
- Subscription: subscription (ref), subscriptionStatus
- Activity: lastLogin, lastPasswordChange, activityLog
- Profile: company, phone, address
- Preferences: newsletter, notifications, marketingEmails
- Role: user, admin

**Key Methods:**
- `comparePassword(candidatePassword)` - Compare hashed passwords
- `incLoginAttempts()` - Increment failed login attempts
- `resetLoginAttempts()` - Reset login attempts after successful login
- `logActivity(action, ipAddress, userAgent)` - Log user activity

**Virtuals:**
- `fullName` - Computed from firstName + lastName
- `isAccountLocked` - Check if account is locked

### 2. Subscription Model

**File**: `src/models/subscription.model.js`

**Schema Fields:**
- User: user (ref to User)
- Plan: planName, planType, features
- Billing: billingCycle, price, currency, paymentMethod
- Status: status, startDate, endDate, nextBillingDate
- Payment: paymentHistory, lastPaymentDate, lastPaymentAmount
- Usage: apiCallsUsed, storageUsed
- Cancellation: cancellationReason, cancellationFeedback

**Key Methods:**
- `addPayment(amount, status, transactionId)` - Record payment
- `cancel(reason, feedback)` - Cancel subscription
- `renew()` - Renew subscription

**Virtuals:**
- `daysRemaining` - Days until expiration
- `isActive` - Check if subscription is active

### 3. Contact Model

**File**: `src/models/contact.model.js`

**Schema Fields:**
- Contact Info: name, email, phone, company
- Message: subject, message, category
- Status: status, priority, assignedTo
- Response: response object, communications array
- Metadata: source, ipAddress, userAgent
- Internal: internalNotes, tags
- Resolution: resolvedAt, resolvedBy, resolutionNotes

**Key Methods:**
- `addCommunication(message, sender, sentBy)` - Add communication
- `addInternalNote(note, addedBy)` - Add internal note
- `assign(userId)` - Assign to admin
- `resolve(resolvedBy, notes)` - Mark as resolved

### 4. Newsletter Model

**File**: `src/models/newsletter.model.js`

**Schema Fields:**
- Contact: email, mobile, contactType
- Verification: isVerified, verificationToken, verifiedAt
- Status: status (pending, active, unsubscribed)
- Preferences: frequency, categories, format
- Metrics: totalEmailsSent, totalEmailsOpened, totalLinksClicked
- Activity: emailActivity array
- Bounce: bounceCount, bounceType
- User Link: user (ref to User)

**Key Methods:**
- `recordEmailSent(campaignId, subject)` - Track sent email
- `recordEmailOpened(campaignId)` - Track email opened
- `recordLinkClicked(campaignId)` - Track link clicked
- `updateEngagementScore()` - Calculate engagement score
- `recordBounce(type, reason)` - Record bounce
- `unsubscribe(reason, feedback)` - Unsubscribe user
- `verify()` - Verify subscription

**Virtuals:**
- `engagementRate` - Email open rate percentage
- `clickRate` - Link click rate percentage

---

## API Routes

### Route Structure

Each route file exports an Express router:

```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller-name');
const { authenticate } = require('../middleware/auth.middleware');

// Public route
router.post('/endpoint', controller.method);

// Protected route
router.get('/endpoint', authenticate, controller.method);

// Admin-only route
router.get('/endpoint', authenticate, authorize('admin'), controller.method);

module.exports = router;
```

### Authentication Routes (7 endpoints)

**File**: `src/routes/auth.routes.js`

1. `POST /api/auth/register` - Register new user
2. `POST /api/auth/login` - Login user
3. `GET /api/auth/verify-email/:token` - Verify email
4. `POST /api/auth/resend-verification` - Resend verification
5. `POST /api/auth/forgot-password` - Request password reset
6. `POST /api/auth/reset-password` - Reset password
7. `POST /api/auth/logout` - Logout user

### User Routes (4 endpoints)

**File**: `src/routes/user.routes.js`

1. `GET /api/users/profile` - Get user profile
2. `PUT /api/users/profile` - Update profile
3. `PUT /api/users/change-password` - Change password
4. `DELETE /api/users/account` - Delete account

### Subscription Routes (8 endpoints)

**File**: `src/routes/subscription.routes.js`

1. `GET /api/subscriptions/plans` - Get plans
2. `POST /api/subscriptions` - Create subscription
3. `GET /api/subscriptions` - Get user subscriptions
4. `GET /api/subscriptions/:id` - Get subscription details
5. `PUT /api/subscriptions/:id` - Update subscription
6. `POST /api/subscriptions/:id/cancel` - Cancel subscription
7. `POST /api/subscriptions/:id/renew` - Renew subscription
8. `GET /api/subscriptions/:id/usage` - Get usage stats

### Contact Routes (8 endpoints)

**File**: `src/routes/contact.routes.js`

1. `POST /api/contacts` - Submit contact form
2. `GET /api/contacts` - Get all contacts (admin)
3. `GET /api/contacts/:id` - Get contact by ID (admin)
4. `PATCH /api/contacts/:id/status` - Update status (admin)
5. `PATCH /api/contacts/:id/assign` - Assign contact (admin)
6. `POST /api/contacts/:id/respond` - Respond to contact (admin)
7. `POST /api/contacts/:id/notes` - Add note (admin)
8. `DELETE /api/contacts/:id` - Delete contact (admin)

### Newsletter Routes (9 endpoints)

**File**: `src/routes/newsletter.routes.js`

1. `POST /api/newsletter/subscribe` - Subscribe
2. `GET /api/newsletter/verify/:token` - Verify subscription
3. `POST /api/newsletter/unsubscribe` - Unsubscribe
4. `POST /api/newsletter/resend-verification` - Resend verification
5. `GET /api/newsletter/subscribers` - Get all subscribers (admin)
6. `GET /api/newsletter/subscribers/:id` - Get subscriber (admin)
7. `PUT /api/newsletter/subscribers/:id` - Update preferences (admin)
8. `DELETE /api/newsletter/subscribers/:id` - Delete subscriber (admin)
9. `POST /api/newsletter/send` - Send newsletter (admin)

---

## Authentication & Authorization

### JWT Authentication

**Token Generation:**
```javascript
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};
```

**Token Verification:**
```javascript
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        }
        throw new Error('Invalid token');
    }
};
```

### Middleware

**Authentication Middleware:**
```javascript
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }
        
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token or inactive user.'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Authentication failed.'
        });
    }
};
```

**Authorization Middleware:**
```javascript
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions.'
            });
        }
        
        next();
    };
};
```

---

## Email System

### Email Configuration

**Setup Nodemailer:**
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
```

### Email Templates (7 Templates)

1. **welcome.html** - New user welcome email
2. **email-verification.html** - Email verification link
3. **password-reset.html** - Password reset link
4. **subscription-confirmation.html** - Subscription confirmation
5. **subscription-cancellation.html** - Cancellation confirmation
6. **newsletter-verification.html** - Newsletter verification
7. **contact-acknowledgment.html** - Contact form acknowledgment

### Sending Emails

```javascript
const sendEmail = async (to, subject, template, data) => {
    try {
        const emailTemplate = await loadTemplate(template);
        const html = replaceVariables(emailTemplate, data);
        
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};
```

---

## Security Features

### 1. Password Security

- **Bcrypt Hashing** (12 rounds)
- **Minimum Length**: 8 characters
- **Complexity Requirements**: Letters, numbers, special characters
- **Password Reset**: Time-limited tokens (1 hour)

### 2. Account Security

- **Login Attempts**: Max 5 failed attempts
- **Account Lockout**: 2 hours after max attempts
- **Email Verification**: Required for new accounts
- **Activity Logging**: Track user actions

### 3. API Security

- **Helmet.js**: Security headers
- **CORS**: Restricted origins
- **Rate Limiting**: 
  - General API: 100 requests/15 minutes
  - Auth endpoints: 5 requests/15 minutes
- **Input Validation**: All user inputs validated
- **SQL Injection Prevention**: Mongoose parameterized queries
- **XSS Prevention**: Input sanitization

### 4. Data Security

- **Environment Variables**: Sensitive data in .env
- **JWT**: Secure token-based authentication
- **HTTPS**: SSL/TLS encryption (production)
- **Database Security**: MongoDB authentication enabled

---

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3000/api/health

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"Test123!"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Unit Tests (Future Implementation)

Framework: Jest or Mocha

```javascript
describe('User Authentication', () => {
    it('should register a new user', async () => {
        // Test logic
    });
    
    it('should login with valid credentials', async () => {
        // Test logic
    });
});
```

### Integration Tests (Future)

Test complete workflows end-to-end.

---

## Contributing Guidelines

### Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Test thoroughly
6. Submit a pull request

### Pull Request Process

1. **Update Documentation**: Update relevant docs
2. **Follow Code Style**: Match existing patterns
3. **Write Tests**: Add tests for new features
4. **Describe Changes**: Write clear PR description
5. **Review Process**: Wait for code review

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: bug fix
docs: documentation update
style: code style changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

Examples:
```
feat: add newsletter subscription endpoint
fix: resolve email verification token expiry issue
docs: update API documentation for subscriptions
```

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] No console.log in production code
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Security considerations addressed
- [ ] Documentation updated
- [ ] Tests pass
- [ ] No breaking changes (or documented)

---

## Additional Resources

- **API Documentation**: `QUICK_REFERENCE.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Getting Started**: `GET_STARTED.md`
- **Implementation Summary**: `SUMMARY.md`

---

## Support

- **Email**: support@cixio.com
- **GitHub**: https://github.com/admin-cixio/landing1
- **Website**: https://www.cixio.com

---

© 2024 CIXIO. All rights reserved.
