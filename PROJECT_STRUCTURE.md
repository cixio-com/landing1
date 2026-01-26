# CIXIO Project Structure

## 📁 Complete Directory Tree

```
landing1/
├── 📄 server.js                          # Main Express server entry point
├── 📄 package.json                       # Dependencies and scripts
├── 📄 .env.example                       # Environment variables template
├── 📄 .env                               # Environment configuration (not in git)
├── 📄 .gitignore                         # Git ignore rules
├── 📄 .dockerignore                      # Docker ignore rules
├── 📄 Dockerfile                         # Docker container configuration
├── 📄 docker-compose.yml                 # Docker Compose orchestration
├── 📄 install.sh                         # Linux/Mac installation script
├── 📄 install.bat                        # Windows installation script
│
├── 📂 src/                               # Backend source code
│   ├── 📂 config/                        # Configuration files
│   │   └── plans.config.js               # Subscription plans configuration
│   │
│   ├── 📂 models/                        # MongoDB/Mongoose models
│   │   ├── user.model.js                 # User schema with authentication
│   │   ├── subscription.model.js         # Subscription schema
│   │   ├── contact.model.js              # Contact form schema
│   │   └── newsletter.model.js           # Newsletter subscription schema
│   │
│   ├── 📂 controllers/                   # Business logic controllers
│   │   ├── auth.controller.js            # Authentication logic
│   │   ├── user.controller.js            # User management logic
│   │   ├── subscription.controller.js    # Subscription management logic
│   │   ├── contact.controller.js         # Contact form logic
│   │   └── newsletter.controller.js      # Newsletter management logic
│   │
│   ├── 📂 routes/                        # API route definitions
│   │   ├── auth.routes.js                # Authentication endpoints
│   │   ├── user.routes.js                # User endpoints
│   │   ├── subscription.routes.js        # Subscription endpoints
│   │   ├── contact.routes.js             # Contact endpoints
│   │   └── newsletter.routes.js          # Newsletter endpoints
│   │
│   ├── 📂 middleware/                    # Express middleware
│   │   └── auth.middleware.js            # JWT authentication & authorization
│   │
│   ├── 📂 utils/                         # Utility functions
│   │   ├── jwt.utils.js                  # JWT token utilities
│   │   └── email.utils.js                # Email sending utilities
│   │
│   └── 📂 emails/                        # Email templates and assets
│       ├── subscription-confirmation.html # Subscription confirmation email
│       ├── subscription-cancellation.html # Subscription cancellation email
│       ├── subscription-renewal.html      # Subscription renewal email
│       └── 📂 templates/                 # Main email templates
│           ├── email-verification.html    # Email verification
│           ├── welcome.html               # Welcome email
│           ├── password-reset.html        # Password reset
│           ├── subscription-confirmation.html # Subscription confirmation
│           ├── contact-acknowledgment.html # Contact acknowledgment
│           ├── newsletter-verification.html # Newsletter verification
│           └── contact-response.html      # Contact response
│
├── 📂 public/                            # Frontend static files
│   ├── �� index.html                     # Main HTML file
│   │
│   ├── 📂 css/                           # Stylesheets
│   │   └── styles.css                    # Main stylesheet (1,300+ lines)
│   │
│   ├── 📂 js/                            # JavaScript files
│   │   ├── api.js                        # API configuration and requests
│   │   ├── forms.js                      # Form handlers with backend integration
│   │   └── main.js                       # Main application logic
│   │
│   └── 📂 assets/                        # Images and icons
│       └── *.svg                         # Logo and icons
│
├── 📂 Logo_and_Banner/                   # Original branding assets
│   └── Various logo files
│
├── 📂 company-details/                   # Company documentation
│   └── PDF files
│
└── 📂 Documentation/                     # Project documentation
    ├── 📄 README.md                      # Main project documentation
    ├── 📄 START_HERE.txt                 # Quick start guide
    ├── 📄 GET_STARTED.md                 # Detailed getting started
    ├── 📄 QUICK_REFERENCE.md             # API quick reference
    ├── 📄 DEPLOYMENT.md                  # Deployment guides
    ├── 📄 DEVELOPMENT.md                 # Development guide
    ├── 📄 IMPLEMENTATION_CHECKLIST.txt   # Feature checklist
    └── 📄 SUMMARY.md                     # Implementation summary
```

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js (v14+)
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB with Mongoose ODM 7.6.3
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Security**: 
  - bcryptjs 2.4.3 (password hashing)
  - helmet 7.1.0 (security headers)
  - cors 2.8.5 (CORS protection)
  - express-rate-limit 7.1.5 (rate limiting)
- **Email**: Nodemailer 7.0.12
- **Validation**: validator 13.11.0

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with variables, flexbox, grid
- **Vanilla JavaScript**: No framework dependencies
- **APIs**: Fetch API for AJAX requests

### DevOps
- **Containerization**: Docker & Docker Compose
- **Package Manager**: npm
- **Development**: nodemon for auto-reload

## 📊 Project Statistics

### Code Metrics
- **Backend Code**: 4,500+ lines
- **Frontend HTML**: 650+ lines
- **Frontend CSS**: 1,300+ lines
- **Frontend JavaScript**: 1,000+ lines
- **Total Code**: 7,450+ lines

### File Counts
- **Total Files**: 45+ created files
- **Models**: 4 (User, Subscription, Contact, Newsletter)
- **Controllers**: 5 (Auth, User, Subscription, Contact, Newsletter)
- **Routes**: 5 route files
- **API Endpoints**: 22+ RESTful endpoints
- **Email Templates**: 7 professional HTML templates
- **Documentation**: 8 comprehensive files (164KB, 6,183 lines)

## 🔐 Security Features

1. **Password Security**
   - bcrypt hashing with 12 salt rounds
   - Minimum 8 characters with complexity requirements
   - Secure password reset with time-limited tokens

2. **Authentication**
   - JWT tokens with 7-day expiration
   - Secure token storage and transmission
   - Email verification for new accounts

3. **Account Protection**
   - Account lockout after 5 failed login attempts
   - 2-hour lockout duration
   - Activity logging for security events

4. **Rate Limiting**
   - General API: 100 requests per 15 minutes
   - Auth endpoints: 5 requests per 15 minutes
   - IP-based tracking

5. **Headers & CORS**
   - Helmet.js security headers
   - CSP (Content Security Policy)
   - Configured CORS for www.cixio.com

6. **Data Validation**
   - Input validation on all endpoints
   - Email format validation
   - SQL injection prevention via Mongoose
   - XSS protection

## 🚀 Deployment Options

The application supports multiple deployment platforms:

1. **Heroku** - Platform as a Service
2. **AWS** - Elastic Beanstalk or EC2
3. **DigitalOcean** - App Platform or Droplet
4. **Docker** - Any Docker-compatible host
5. **VPS** - Traditional server deployment

See `DEPLOYMENT.md` for detailed instructions.

## 📧 Email Service Configuration

The application is configured to work with:
- Custom SMTP (mail.cixio.com)
- Gmail (development only)
- SendGrid
- AWS SES
- Mailgun

All email templates are professionally designed and mobile-responsive.

## 🗄️ Database Collections

### 1. Users Collection
- Authentication credentials
- Email verification status
- Password reset tokens
- Account lockout data
- Activity logs
- User preferences
- Subscription references

### 2. Subscriptions Collection
- Plan details (Starter, Professional, Enterprise)
- Billing information
- Payment history
- Usage tracking
- Auto-renewal settings
- Cancellation data

### 3. Contacts Collection
- Contact form submissions
- Status tracking (new, in_progress, resolved)
- Admin assignment
- Communication history
- Internal notes
- Priority levels

### 4. Newsletter Collection
- Email/mobile subscriptions
- Verification status (double opt-in)
- Engagement metrics
- Preferences
- Unsubscribe tracking

## 🔄 API Endpoints Summary

### Authentication (7 endpoints)
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/verify-email/:token
- POST /api/auth/resend-verification
- POST /api/auth/forgot-password
- POST /api/auth/reset-password/:token
- POST /api/auth/logout

### Users (6 endpoints)
- GET /api/users/profile
- PUT /api/users/profile
- PUT /api/users/change-password
- DELETE /api/users/account
- GET /api/users (admin)
- GET /api/users/:id (admin)

### Subscriptions (8 endpoints)
- GET /api/subscriptions/plans
- POST /api/subscriptions
- GET /api/subscriptions
- GET /api/subscriptions/:id
- PUT /api/subscriptions/:id
- POST /api/subscriptions/:id/cancel
- POST /api/subscriptions/:id/renew
- GET /api/subscriptions/:id/usage

### Contacts (8 endpoints)
- POST /api/contacts
- GET /api/contacts (admin)
- GET /api/contacts/:id (admin)
- PUT /api/contacts/:id/status (admin)
- PUT /api/contacts/:id/assign (admin)
- POST /api/contacts/:id/respond (admin)
- POST /api/contacts/:id/note (admin)
- DELETE /api/contacts/:id (admin)

### Newsletter (9 endpoints)
- POST /api/newsletter/subscribe
- GET /api/newsletter/verify/:token
- POST /api/newsletter/unsubscribe
- POST /api/newsletter/resend-verification
- GET /api/newsletter/subscribers (admin)
- GET /api/newsletter/subscribers/:id (admin)
- PUT /api/newsletter/subscribers/:id (admin)
- DELETE /api/newsletter/subscribers/:id (admin)
- POST /api/newsletter/send (admin)

**Total: 38 API Endpoints**

## 💾 Installation & Setup

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/admin-cixio/landing1.git
cd landing1

# 2. Run installation script
# Linux/Mac:
chmod +x install.sh
./install.sh

# Windows:
install.bat

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Start application
npm start
```

### Docker Quick Start
```bash
# Build and run with Docker Compose
docker-compose up -d

# Application: http://localhost:3000
# MongoDB Express: http://localhost:8081
```

## 📞 Support

- **Technical Support**: support@cixio.com
- **Sales**: sales@cixio.com
- **General**: info@cixio.com
- **Website**: www.cixio.com

---

**CIXIO** - Advanced AI Software Solutions
© 2024 CIXIO. All rights reserved.
