# CIXIO.COM (landing1) — Knowledge Base

> Main CIXIO company platform — user registration, subscriptions, newsletter, contact API

## Quick Reference

| Property | Value |
|---|---|
| **Repo** | `CIXIO.COM/landing1` |
| **Type** | Full-stack web app (SPA + REST API) |
| **Domain** | `cixio.com` / `www.cixio.com` |
| **Host Port** | 5001 |
| **Container** | 1: `cixio-com-app` (Node.js, port 80 inside) |
| **Database** | MongoDB (central replica set `rs0`) |
| **Status** | Production-ready (v2.0.0) |

## Architecture

```
Host :5001 → cixio-com-app (Express on port 80)
  /api/*   → REST API (auth, users, subscriptions, contact, newsletter)
  /*       → Static frontend (public/)
MongoDB    → Central replica set (cixio-shared-db Docker network)
```

## Repo Structure

| Path | Purpose |
|---|---|
| `server.js` | Express entry point |
| `src/controllers/` | auth, user, contact, newsletter, subscription |
| `src/models/` | User, Contact, Newsletter (subscriber), Subscription |
| `src/routes/` | auth, user, contact, newsletter, subscription, test-email |
| `src/middleware/` | JWT auth, rate limiting |
| `src/emails/` | HTML email templates (welcome, verify, reset, subscription) |
| `public/` | Static frontend (HTML/CSS/JS) |
| `src/config/plans.config.js` | Subscription plan definitions |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 18+, Express 4.18 |
| Database | MongoDB 6/7 (Mongoose 7.6) via central replica set |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Email | Nodemailer (AWS SES / SMTP) |
| Security | Helmet, CORS, express-rate-limit |
| Container | Docker single-stage |

## API Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login → JWT |
| POST | `/api/auth/verify-email` | No | Email verification |
| POST | `/api/auth/forgot-password` | No | Password reset request |
| POST | `/api/auth/reset-password` | No | Reset password |
| GET | `/api/user/profile` | JWT | Get own profile |
| PUT | `/api/user/profile` | JWT | Update profile |
| DELETE | `/api/user/delete` | JWT | Delete account |
| POST | `/api/subscription` | JWT | Subscribe to plan |
| GET | `/api/subscription` | JWT | Get subscription |
| DELETE | `/api/subscription/cancel` | JWT | Cancel subscription |
| POST | `/api/newsletter` | No | Subscribe to newsletter |
| DELETE | `/api/newsletter/unsubscribe` | No | Unsubscribe |
| POST | `/api/contact` | No | Submit contact form |

## Subscription Plans

Defined in `src/config/plans.config.js` — multiple tiers available.

## ENV Vars

| Var | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection (defaults to central replica set) |
| `JWT_SECRET` | JWT signing secret |
| `SMTP_HOST/PORT/USER/PASS` | Email (AWS SES or SMTP) |
| `FROM_EMAIL` | Sender email address |
| `FRONTEND_URL` | CORS origin (cixio.com) |

## Deployment

```
Dockerfile → docker build → docker compose up
Networks: cixio-com-network + cixio-shared-db (external, for MongoDB)
Scripts: deploy-production.sh, deploy-stage.sh, deploy-on-server.sh
```

## Microservice Role

- **Provides**: User identity, subscriptions, newsletter, contact for cixio.com
- **Auth**: Own JWT (to be replaced by cixio-sso)
- **Depends on**: Central MongoDB (cixio-shared-db network)
- **Used by**: cixio.com web visitors, mobile app (future)

## Gaps / TODO

- [ ] SSO integration (migrate auth to cixio-sso)
- [ ] Razorpay/Stripe payment integration for subscriptions
- [ ] GitHub Actions CI/CD pipeline
