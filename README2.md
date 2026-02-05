
# FX Trading App Backend

A NestJS-based backend for a foreign exchange (FX) trading application. Users can register, verify their email, fund wallets, view balances, convert currencies, trade with fees, and view transaction history. Admins have additional oversight capabilities.

**Live Demo:** https://forex-trading-app-api.onrender.com  
**Swagger API Documentation:** https://forex-trading-app-api.onrender.com/api

## Features

- User registration with email + password
- Email verification via OTP (expires in 5 minutes)
- Multi-currency wallet (NGN, USD, EUR, GBP, CAD — configurable)
- Real-time FX rates from exchangerate-api.com (cached 5 minutes)
- Simple currency conversion (`/wallet/convert`) — no fee
- Currency trading (`/wallet/trade`) with:
  - 0.5% fee deducted from input amount
  - Minimum trade amount of 50 units
  - Different transaction type (`TRADE` vs `CONVERT`)
  - Distinct success message and description
- Transaction history with full audit trail
- Role-Based Access Control (RBAC): USER vs ADMIN
- Admin endpoints: view all users, all transactions, etc.
- Security: JWT authentication, input validation, atomic transactions, bcrypt passwords, OTP hashing
- Idempotency support via optional `idempotencyKey`

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database/ORM**: PostgreSQL + TypeORM
- **Authentication**: JWT + Passport
- **Email**: Nodemailer (Gmail SMTP or alternative)
- **Precision Math**: decimal.js
- **Validation**: class-validator + class-transformer
- **API Docs**: Swagger (@nestjs/swagger)
- **Testing**: Jest (unit + e2e)

## Setup Instructions

### Prerequisites

- Node.js ≥ 18
- PostgreSQL (local, Supabase, Neon, etc.)
- Gmail account with App Password (for SMTP) or alternative provider
- Free API key from https://www.exchangerate-api.com

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd fx-trading-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file in the root:
   ```env
   # Database (example: Supabase)
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres

   # JWT
   JWT_SECRET=your-very-long-random-secret-here-change-this

   # Email (Gmail App Password recommended)
   SMTP_USER=your.email@gmail.com
   SMTP_PASS=your-16-char-app-password

   # FX Rates
   FX_API_KEY=your_exchangerate_api_key_here

   # Supported currencies (must include NGN as base)
   SUPPORTED_CURRENCIES=NGN,USD,EUR,GBP,CAD

   # Trading fee (0.005 = 0.5%)
   TRADE_FEE_RATE=0.005
   ```

4. Run migrations (creates tables):
   ```bash
   npm run typeorm migration:run
   # or if using synchronize: true in dev → just start the app
   ```

5. Start the application:
   ```bash
   # Development (recommended)
   npm run start:dev

   # Production build & run
   npm run build
   npm run start:prod
   ```

App runs on `http://localhost:3000`  
Swagger docs: `http://localhost:3000/api`

## Key Assumptions

- Users start with 0 balance in all currencies.
- FX rates are cached for 5 minutes to reduce API calls.
- Supported currencies: NGN (base), USD, EUR, GBP, CAD.
- Conversions/trades use base currency (NGN) for cross-currency trades.
- Email verification is required before trading.
- Transactions are atomic to prevent race conditions.
- Insufficient balance prevents conversions/trades.
- OTP expires in 5 minutes.

## API Endpoints

### Public (no authentication)

- `POST /auth/register` — Register + send OTP
- `POST /auth/verify` — Verify OTP
- `POST /auth/resend-otp` — Resend OTP
- `POST /auth/login` — Get JWT token

### Protected (USER + ADMIN roles)

- `GET /wallet` — Get all balances (`?currency=USD` optional)
- `POST /wallet/fund` — Fund wallet (NGN only for now)
- `POST /wallet/convert` — Simple currency conversion (no fee)
- `POST /wallet/trade` — Trade with 0.5% fee + min 50
- `GET /wallet/transactions` — User's transaction history
- `GET /fx/rates` — Current rates for supported pairs

### Admin Only (role: ADMIN)

- `GET /admin/users` — List all users
- `GET /admin/users/:id` — Get user details
- `GET /admin/transactions` — List all transactions
- `GET /admin/users/:userId/transactions` — Transactions for one user
- `POST /admin/currencies` — Manage supported currencies (future)
- `DELETE /admin/users/:id` — Delete/ban user (future)

## Conversion vs Trade – Key Differences

| Feature                     | /wallet/convert                  | /wallet/trade                              |
|-----------------------------|-----------------------------------|---------------------------------------------|
| Fee                         | None                             | 0.5% (deducted from input amount)           |
| Minimum amount              | 0.01                             | 50 units                                    |
| Transaction type (DB)       | `CONVERT`                        | `TRADE`                                     |
| Success message             | "Conversion successful"          | "Trade executed successfully"               |
| Description prefix          | "Converted ..."                  | "Traded ..."                                |
| Response fields             | Basic                            | Includes `grossFromAmount`, `fee`, `netFromAmount` |

**Money flow example (trade: 55 CAD → NGN)**:
- Deduct full **55 CAD** from CAD balance
- Fee: **0.275 CAD** (0.5%) — removed/lost from CAD
- Convert only **54.725 CAD** at current rate
- Add ~**55,389.676 NGN** to NGN balance
- Fee is **not** transferred — platform keeps it (simple revenue model)

## Architectural Decisions

- **Modular Structure**: Separate modules for Auth, Wallet, FX, Admin
- **Entity Design**: User, WalletBalance, Transaction entities with TypeORM
- **Service Layer**: Business logic in services, controllers handle HTTP
- **Validation**: Class-validator + class-transformer for DTOs
- **Error Handling**: Global exception filters + try/catch in transactions
- **Caching**: In-memory for FX rates; Redis-ready
- **Security**: Bcrypt passwords, JWT auth, RBAC guards, atomic transactions
- **Database**: PostgreSQL with indexes on `userId`, `createdAt`, `currency`
- **Scalability**: Stateless design, easy to add Redis, rate limiting, microservices

## Running Tests

```bash
# Unit + integration
npm test

# End-to-end
npm run test:e2e

# Coverage report
npm run test:cov
```

## Deployment Notes

- Use Docker + PostgreSQL (Supabase, Neon, Railway, Fly.io, etc.)
- Set strong `JWT_SECRET` (at least 32 chars)
- Use production-grade email (SendGrid, Resend, AWS SES) instead of Gmail
- Add rate limiting on auth endpoints (`@nestjs/throttler`)
- Monitor slow queries (indexes on `userId`, `createdAt`)
- Enable logging & error tracking (Sentry, Logtail, etc.)

## Future Improvements

- Real fee wallet / accounting system
- Slippage tolerance & limit orders
- KYC / identity verification
- WebSocket live rate updates
- Mobile push/email notifications
- Currency management UI for admins

Happy coding & trading! 🚀

Last updated: February 2026
```

This is now a single, clean, up-to-date README that covers everything from both files in a logical order.

You can directly replace your existing `README.md` with this content.

If you'd like to add:
- Screenshots (e.g. Swagger UI)
- A section on "How to create an admin user"
- Docker instructions
- Or any other tweak

Just let me know! Good luck with the project submission!