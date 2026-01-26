# QUICK REFERENCE - CIXIO API

Fast reference guide for all 22 API endpoints, common commands, and code examples.

---

## Table of Contents

- [API Base URL](#api-base-url)
- [Authentication](#authentication)
- [All 22 API Endpoints](#all-22-api-endpoints)
- [Authentication Endpoints (7)](#authentication-endpoints)
- [User Management Endpoints (4)](#user-management-endpoints)
- [Subscription Endpoints (8)](#subscription-endpoints)
- [Contact Form Endpoints (8)](#contact-form-endpoints)
- [Newsletter Endpoints (9)](#newsletter-endpoints)
- [Response Formats](#response-formats)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Common Commands](#common-commands)

---

## API Base URL

```
Development: http://localhost:3000/api
Production:  https://www.cixio.com/api
```

---

## Authentication

Most endpoints require JWT authentication. Include the token in the header:

```
Authorization: Bearer <your-jwt-token>
```

**Get Token**: Login or register to receive JWT token.

---

## All 22 API Endpoints

### Quick Overview

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| **AUTHENTICATION (7 endpoints)** |
| 1 | POST | `/api/auth/register` | No | Register new user |
| 2 | POST | `/api/auth/login` | No | Login user |
| 3 | GET | `/api/auth/verify-email/:token` | No | Verify email |
| 4 | POST | `/api/auth/resend-verification` | No | Resend verification |
| 5 | POST | `/api/auth/forgot-password` | No | Request password reset |
| 6 | POST | `/api/auth/reset-password` | No | Reset password |
| 7 | POST | `/api/auth/logout` | Optional | Logout user |
| **USER MANAGEMENT (4 endpoints)** |
| 8 | GET | `/api/users/profile` | Yes | Get user profile |
| 9 | PUT | `/api/users/profile` | Yes | Update profile |
| 10 | PUT | `/api/users/change-password` | Yes | Change password |
| 11 | DELETE | `/api/users/account` | Yes | Delete account |
| **SUBSCRIPTIONS (8 endpoints)** |
| 12 | GET | `/api/subscriptions/plans` | No | Get subscription plans |
| 13 | POST | `/api/subscriptions` | Yes | Create subscription |
| 14 | GET | `/api/subscriptions` | Yes | Get user subscriptions |
| 15 | GET | `/api/subscriptions/:id` | Yes | Get subscription details |
| 16 | PUT | `/api/subscriptions/:id` | Yes | Update subscription |
| 17 | POST | `/api/subscriptions/:id/cancel` | Yes | Cancel subscription |
| 18 | POST | `/api/subscriptions/:id/renew` | Yes | Renew subscription |
| 19 | GET | `/api/subscriptions/:id/usage` | Yes | Get usage statistics |
| **CONTACT FORM (8 endpoints)** |
| 20 | POST | `/api/contacts` | No | Submit contact form |
| 21 | GET | `/api/contacts` | Admin | Get all contacts |
| 22 | GET | `/api/contacts/:id` | Admin | Get contact by ID |
| **NEWSLETTER (9 endpoints - bonus!)** |
| 23 | POST | `/api/newsletter/subscribe` | No | Subscribe to newsletter |
| 24 | GET | `/api/newsletter/verify/:token` | No | Verify subscription |
| 25 | POST | `/api/newsletter/unsubscribe` | No | Unsubscribe |
| 26 | POST | `/api/newsletter/resend-verification` | No | Resend verification |

*Note: Additional admin endpoints exist for contacts and newsletter management*

---

## Authentication Endpoints

### 1. Register User

**POST** `/api/auth/register`

Register a new user account.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "mobile": "1234567890",
    "company": "Tech Corp"
  }'
```

**Request Body:**
```json
{
  "firstName": "John",           // Required, 2-50 chars
  "lastName": "Doe",             // Required, 2-50 chars
  "email": "john@example.com",   // Required, unique, valid email
  "password": "SecurePass123!",  // Required, min 8 chars
  "mobile": "1234567890",        // Optional, 10-15 digits
  "company": "Tech Corp"         // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "65a1b2c3d4e5f6789012345",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. Login User

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "65a1b2c3d4e5f6789012345",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "user",
    "isEmailVerified": true,
    "subscriptionStatus": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Verify Email

**GET** `/api/auth/verify-email/:token`

Verify user's email address using the token sent via email.

```bash
curl http://localhost:3000/api/auth/verify-email/abc123def456ghi789
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now login."
}
```

---

### 4. Resend Verification Email

**POST** `/api/auth/resend-verification`

Resend email verification link.

```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

---

### 5. Forgot Password

**POST** `/api/auth/forgot-password`

Request password reset email.

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

---

### 6. Reset Password

**POST** `/api/auth/reset-password`

Reset password using token from email.

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "newPassword": "NewSecurePass456!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

---

### 7. Logout

**POST** `/api/auth/logout`

Logout user (optional authentication for activity logging).

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Management Endpoints

### 8. Get User Profile

**GET** `/api/users/profile`

Get current user's profile information.

```bash
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "65a1b2c3d4e5f6789012345",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "mobile": "1234567890",
    "company": "Tech Corp",
    "isEmailVerified": true,
    "subscriptionStatus": "active",
    "role": "user",
    "preferences": {
      "newsletter": true,
      "notifications": true,
      "marketingEmails": false
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastLogin": "2024-01-20T14:25:00.000Z"
  }
}
```

---

### 9. Update Profile

**PUT** `/api/users/profile`

Update user profile information.

```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "mobile": "9876543210",
    "company": "New Company",
    "preferences": {
      "newsletter": true,
      "notifications": true
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

---

### 10. Change Password

**PUT** `/api/users/change-password`

Change user's password.

```bash
curl -X PUT http://localhost:3000/api/users/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword456!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 11. Delete Account

**DELETE** `/api/users/account`

Soft delete user account (can be recovered within 30 days).

```bash
curl -X DELETE http://localhost:3000/api/users/account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "CurrentPassword123!",
    "reason": "No longer need the service"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## Subscription Endpoints

### 12. Get Subscription Plans

**GET** `/api/subscriptions/plans`

Get all available subscription plans.

```bash
curl http://localhost:3000/api/subscriptions/plans
```

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "starter",
      "name": "Starter",
      "description": "Perfect for small teams getting started",
      "pricing": {
        "monthly": 29,
        "annually": 290
      },
      "features": {
        "users": 5,
        "storage": "10GB",
        "apiCalls": "10,000/month",
        "support": "Email Support",
        "customIntegration": false,
        "advancedAnalytics": false
      }
    },
    {
      "id": "professional",
      "name": "Professional",
      "description": "Advanced features for growing businesses",
      "pricing": {
        "monthly": 99,
        "annually": 990
      },
      "features": {
        "users": 20,
        "storage": "100GB",
        "apiCalls": "100,000/month",
        "support": "Priority Email & Chat",
        "customIntegration": true,
        "advancedAnalytics": true
      }
    },
    {
      "id": "enterprise",
      "name": "Enterprise",
      "description": "Custom solutions for large organizations",
      "pricing": {
        "monthly": 299,
        "annually": 2990
      },
      "features": {
        "users": "Unlimited",
        "storage": "Unlimited",
        "apiCalls": "Unlimited",
        "support": "24/7 Priority Support",
        "customIntegration": true,
        "advancedAnalytics": true,
        "dedicatedManager": true
      }
    }
  ]
}
```

---

### 13. Create Subscription

**POST** `/api/subscriptions`

Create a new subscription for authenticated user.

```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planType": "professional",
    "billingCycle": "monthly",
    "paymentMethod": "credit_card"
  }'
```

**Request Body:**
```json
{
  "planType": "professional",        // starter, professional, enterprise
  "billingCycle": "monthly",         // monthly, annually
  "paymentMethod": "credit_card"     // credit_card, paypal, bank_transfer
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "subscription": {
    "id": "65a1b2c3d4e5f6789012345",
    "planName": "Professional",
    "planType": "professional",
    "billingCycle": "monthly",
    "price": 99,
    "status": "active",
    "startDate": "2024-01-20T00:00:00.000Z",
    "endDate": "2024-02-20T00:00:00.000Z",
    "autoRenew": true
  }
}
```

---

### 14. Get User Subscriptions

**GET** `/api/subscriptions`

Get all subscriptions for authenticated user.

```bash
curl http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "subscriptions": [
    {
      "id": "65a1b2c3d4e5f6789012345",
      "planName": "Professional",
      "status": "active",
      "startDate": "2024-01-20T00:00:00.000Z",
      "endDate": "2024-02-20T00:00:00.000Z",
      "daysRemaining": 15
    }
  ]
}
```

---

### 15. Get Subscription Details

**GET** `/api/subscriptions/:id`

Get detailed information about a specific subscription.

```bash
curl http://localhost:3000/api/subscriptions/65a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "65a1b2c3d4e5f6789012345",
    "planName": "Professional",
    "planType": "professional",
    "billingCycle": "monthly",
    "price": 99,
    "currency": "USD",
    "status": "active",
    "startDate": "2024-01-20T00:00:00.000Z",
    "endDate": "2024-02-20T00:00:00.000Z",
    "nextBillingDate": "2024-02-20T00:00:00.000Z",
    "autoRenew": true,
    "features": {
      "users": 20,
      "storage": "100GB",
      "apiCalls": "100,000/month",
      "support": "Priority Email & Chat"
    },
    "usage": {
      "apiCallsUsed": 25430,
      "storageUsed": 45.2
    }
  }
}
```

---

### 16. Update Subscription

**PUT** `/api/subscriptions/:id`

Update subscription (change plan or billing cycle).

```bash
curl -X PUT http://localhost:3000/api/subscriptions/65a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planType": "enterprise",
    "billingCycle": "annually"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "subscription": { /* updated subscription */ }
}
```

---

### 17. Cancel Subscription

**POST** `/api/subscriptions/:id/cancel`

Cancel a subscription.

```bash
curl -X POST http://localhost:3000/api/subscriptions/65a1b2c3d4e5f6789012345/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "too_expensive",
    "feedback": "Great service but too costly for now"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "subscription": {
    "status": "cancelled",
    "cancelledAt": "2024-01-20T15:30:00.000Z"
  }
}
```

---

### 18. Renew Subscription

**POST** `/api/subscriptions/:id/renew`

Renew a cancelled or expired subscription.

```bash
curl -X POST http://localhost:3000/api/subscriptions/65a1b2c3d4e5f6789012345/renew \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription renewed successfully",
  "subscription": {
    "status": "active",
    "startDate": "2024-01-20T00:00:00.000Z",
    "endDate": "2024-02-20T00:00:00.000Z"
  }
}
```

---

### 19. Get Subscription Usage

**GET** `/api/subscriptions/:id/usage`

Get usage statistics for a subscription.

```bash
curl http://localhost:3000/api/subscriptions/65a1b2c3d4e5f6789012345/usage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "usage": {
    "subscription": "Professional Plan",
    "billingCycle": "monthly",
    "currentPeriod": {
      "start": "2024-01-20T00:00:00.000Z",
      "end": "2024-02-20T00:00:00.000Z"
    },
    "apiCalls": {
      "used": 25430,
      "limit": 100000,
      "percentage": 25.43
    },
    "storage": {
      "used": "45.2 GB",
      "limit": "100 GB",
      "percentage": 45.2
    }
  }
}
```

---

## Contact Form Endpoints

### 20. Submit Contact Form

**POST** `/api/contacts`

Submit a new contact form message.

```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "company": "ABC Corp",
    "subject": "Partnership Inquiry",
    "message": "I would like to discuss a potential partnership opportunity.",
    "category": "partnership"
  }'
```

**Request Body:**
```json
{
  "name": "Jane Smith",                  // Required, 2-100 chars
  "email": "jane@example.com",           // Required, valid email
  "phone": "+1234567890",                // Optional
  "company": "ABC Corp",                 // Optional
  "subject": "Partnership Inquiry",      // Required, max 200 chars
  "message": "Long message text...",     // Required, 10-2000 chars
  "category": "partnership"              // Optional: general, sales, support, etc.
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact form submitted successfully. We'll get back to you soon!",
  "contact": {
    "id": "65a1b2c3d4e5f6789012345",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "subject": "Partnership Inquiry",
    "status": "new",
    "priority": "medium",
    "createdAt": "2024-01-20T15:45:00.000Z"
  }
}
```

---

### 21. Get All Contacts (Admin Only)

**GET** `/api/contacts`

Get all contact form submissions with filters.

```bash
curl "http://localhost:3000/api/contacts?status=new&priority=high&page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Query Parameters:**
- `status` - Filter by status: new, in_progress, resolved, closed, spam
- `priority` - Filter by priority: low, medium, high, urgent
- `category` - Filter by category: general, sales, support, technical, billing, partnership
- `isRead` - Filter by read status: true, false
- `isArchived` - Filter archived: true, false
- `search` - Search in name, email, subject, message
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field: createdAt, priority, status
- `sortOrder` - Sort order: asc, desc

**Response:**
```json
{
  "success": true,
  "contacts": [ /* array of contacts */ ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalContacts": 47,
    "perPage": 10
  }
}
```

---

### 22. Get Contact by ID (Admin Only)

**GET** `/api/contacts/:id`

Get detailed information about a specific contact.

```bash
curl http://localhost:3000/api/contacts/65a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "contact": {
    "id": "65a1b2c3d4e5f6789012345",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "company": "ABC Corp",
    "subject": "Partnership Inquiry",
    "message": "Full message text...",
    "status": "new",
    "priority": "high",
    "category": "partnership",
    "source": "website",
    "isRead": false,
    "createdAt": "2024-01-20T15:45:00.000Z",
    "communications": [],
    "internalNotes": []
  }
}
```

---

## Newsletter Endpoints

### 23. Subscribe to Newsletter

**POST** `/api/newsletter/subscribe`

Subscribe to newsletter (double opt-in - requires email verification).

```bash
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com",
    "preferences": {
      "frequency": "weekly",
      "categories": ["product_updates", "blog_posts"]
    }
  }'
```

**Request Body:**
```json
{
  "email": "subscriber@example.com",   // Required (either email or mobile)
  "mobile": "1234567890",              // Optional
  "name": "John Doe",                  // Optional
  "preferences": {
    "frequency": "weekly",             // daily, weekly, monthly
    "categories": [                    // Optional
      "product_updates",
      "blog_posts",
      "promotions"
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent. Please check your inbox to confirm subscription.",
  "subscriber": {
    "email": "subscriber@example.com",
    "status": "pending",
    "isVerified": false
  }
}
```

---

### 24. Verify Newsletter Subscription

**GET** `/api/newsletter/verify/:token`

Verify newsletter subscription using token from email.

```bash
curl http://localhost:3000/api/newsletter/verify/abc123def456ghi789
```

**Response:**
```json
{
  "success": true,
  "message": "Newsletter subscription verified successfully. Welcome!",
  "subscriber": {
    "email": "subscriber@example.com",
    "status": "active",
    "isVerified": true,
    "verifiedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

---

### 25. Unsubscribe from Newsletter

**POST** `/api/newsletter/unsubscribe`

Unsubscribe from newsletter.

```bash
curl -X POST http://localhost:3000/api/newsletter/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com",
    "reason": "too_frequent",
    "feedback": "Receiving too many emails"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "You have been unsubscribed successfully. We're sorry to see you go!",
  "subscriber": {
    "email": "subscriber@example.com",
    "status": "unsubscribed",
    "unsubscribedAt": "2024-01-20T16:15:00.000Z"
  }
}
```

---

### 26. Resend Newsletter Verification

**POST** `/api/newsletter/resend-verification`

Resend newsletter verification email.

```bash
curl -X POST http://localhost:3000/api/newsletter/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* validation errors if applicable */ ]
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

### General API Endpoints

- **Window**: 15 minutes
- **Limit**: 100 requests per IP

### Authentication Endpoints

- **Window**: 15 minutes
- **Limit**: 5 requests per IP

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705764000
```

**Rate Limit Exceeded Response:**
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Common Commands

### Start Server

```bash
npm start              # Production mode
npm run dev            # Development mode with auto-reload
```

### Test Health Check

```bash
curl http://localhost:3000/api/health
```

### Complete Registration Flow

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"SecurePass123!"}'

# 2. Verify email (use token from email)
curl http://localhost:3000/api/auth/verify-email/<TOKEN>

# 3. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!"}'

# 4. Use token in subsequent requests
export TOKEN="<your-jwt-token>"
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Subscribe and Verify Newsletter

```bash
# 1. Subscribe
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"subscriber@example.com"}'

# 2. Verify (use token from email)
curl http://localhost:3000/api/newsletter/verify/<TOKEN>
```

### Create Subscription Flow

```bash
# 1. Login and get token
export TOKEN="<your-jwt-token>"

# 2. View available plans
curl http://localhost:3000/api/subscriptions/plans

# 3. Create subscription
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planType":"professional","billingCycle":"monthly","paymentMethod":"credit_card"}'

# 4. Check subscription status
curl http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer $TOKEN"
```

---

## JavaScript/Node.js Examples

### Using Fetch API

```javascript
// Register User
const registerUser = async () => {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'SecurePass123!'
    })
  });
  
  const data = await response.json();
  console.log(data);
  
  // Save token
  localStorage.setItem('token', data.token);
};

// Authenticated Request
const getProfile = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/users/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log(data);
};
```

### Using Axios

```javascript
const axios = require('axios');

// Set base URL
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response.data);
  }
};

// Get Profile
const getProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Create Subscription
const createSubscription = async (planType, billingCycle) => {
  try {
    const response = await api.post('/subscriptions', {
      planType,
      billingCycle,
      paymentMethod: 'credit_card'
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/cixio

# Security
JWT_SECRET=your-secure-secret-key
JWT_EXPIRE=7d

# Email
EMAIL_HOST=mail.cixio.com
EMAIL_PORT=587
EMAIL_USER=noreply@cixio.com
EMAIL_PASS=your-password
EMAIL_FROM=CIXIO <noreply@cixio.com>

# URLs
FRONTEND_URL=https://www.cixio.com
API_URL=https://www.cixio.com/api
```

---

## Additional Resources

- **Complete Documentation**: `README.md`
- **Getting Started**: `GET_STARTED.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Development Guide**: `DEVELOPMENT.md`
- **Implementation Summary**: `SUMMARY.md`

---

**Support**: support@cixio.com  
**Website**: https://www.cixio.com  
**API Docs**: https://www.cixio.com/api/docs

© 2024 CIXIO. All rights reserved.
