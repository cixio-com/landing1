# CIXIO.COM Landing1 — Knowledge Base

> Corporate landing page + full backend API for cixio.com

## Quick Reference

| Property | Value |
|---|---|
| **Repo** | `CIXIO.COM/landing1` |
| **Type** | Monolithic MVC REST API + static SPA |
| **Domain** | `cixio.com` (also serves cixio.ai, cixio.io, cixio.in) |
| **Host Port** | 5001 → container 80 |
| **Container** | 1: `cixio-com-app` (Node 18 Alpine) |
| **Database** | MongoDB (external replica set) |
| **Status** | Complete (36 API endpoints) |

## Architecture

```
Monolithic Express server (server.js)
├── public/           → Static SPA (landing + legal pages)
├── src/routes/       → 5 route groups (auth, user, subscription, contact, newsletter)
├── src/controllers/  → Business logic
├── src/models/       → 4 Mongoose models
├── src/middleware/    → JWT auth middleware
├── src/utils/        → Email + JWT utilities
└── src/emails/       → 7 HTML email templates
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 18, Express 4.18.2 |
| Database | MongoDB 7+ (Mongoose 7.6.3, external replica set) |
| Auth | JWT + bcrypt (12 rounds) |
| Email | Nodemailer → AWS SES |
| Security | Helmet, CORS, express-rate-limit, validator |
| Frontend | Static HTML/CSS/JS SPA |

## API Endpoints (36 total)

| Group | Count | Key Routes |
|---|---|---|
| Auth | 7 | register, login, verify-email, forgot/reset password |
| Users | 6 | profile CRUD, admin user listing |
| Subscriptions | 8 | plans, subscribe, cancel, renew, usage |
| Contacts | 8 | submit, admin manage, respond, notes |
| Newsletter | 9 | subscribe (double opt-in), admin manage, send broadcast |
| Utility | 1 | `/api/health` |

## Database (MongoDB)

| Collection | Purpose |
|---|---|
| User | Multi-role (user/admin), email/phone verified |
| Subscription | Starter/Professional/Enterprise plans |
| Contact | Contact form submissions + admin management |
| Newsletter | Double opt-in subscribers |

## Deployment

| Item | Value |
|---|---|
| Container | `cixio-com-app` |
| Port | 5001 → 80 |
| MongoDB | External server (`cixio-mongodb-server` SSH alias) |
| Deploy | SSH + tar image transfer to EC2 |

## Notes

- Subscription model exists but no payment gateway integrated
- 7 professional transactional email templates (welcome, verify, reset, etc.)
- 8 legal pages (ToS, privacy, EULA, DMCA, patents, etc.)
- No tests, no linting configured
