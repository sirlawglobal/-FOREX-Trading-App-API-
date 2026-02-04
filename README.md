# FX Trading App Backend

A NestJS-based backend for an FX Trading App where users can trade currencies, including Naira (NGN) and other international currencies.

**Live on:** https://forex-trading-app-api.onrender.com

## Features

- **User Registration & Email Verification**: Users register with email and receive OTP for verification.
- **Multi-Currency Wallet**: Supports balances in NGN, USD, EUR, GBP, etc.
- **FX Rate Integration**: Fetches real-time rates from exchangerate-api.com, cached in-memory.
- **Currency Conversion & Trading**: Convert/trade NGN ↔ other currencies using live rates.
- **Transaction History**: Logs all funding, conversions, and trades.
- **Security**: JWT authentication, input validation, atomic transactions.

## Tech Stack

- **Framework**: NestJS
- **ORM**: TypeORM
- **Database**: PostgreSQL (configurable to MySQL)
- **Authentication**: JWT with Passport
- **Email**: Nodemailer (Gmail SMTP)
- **Caching**: In-memory cache for FX rates
- **Testing**: Jest with unit and e2e tests

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL (or MySQL)
- Gmail account for SMTP (or configure another provider)

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd fx-trading-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables. Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://postgres.jfykczizdmrahhrkolkp:[PASSWORD PLACEHOLDER]N@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
   SUPPORTED_BALANCE_CURRENCIES=NGN,USD,EUR,GBP,CAD
   SUPPORTED_TO_CURRENCIES=USD,EUR,GBP,CAD
   JWT_SECRET=your_jwt_secret
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   FX_API_KEY=your_fx_api_key
   ```

4. Run database migrations (if using TypeORM CLI):
   ```bash
   npm run build
   npx typeorm migration:run
   ```

5. Start the application:
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

The app will run on `http://localhost:3000`. Swagger docs at `http://localhost:3000/api`.

## Key Assumptions

- Users start with 0 balance in all currencies.
- FX rates are cached for 5 minutes to reduce API calls.
- Supported currencies: NGN, USD, EUR, GBP, CAD.
- Conversions use base currency (NGN) for cross-currency trades.
- Email verification is required before trading.
- Transactions are atomic to prevent race conditions.
- Insufficient balance prevents conversions.
- OTP expires in 5 minutes.

## Architectural Data Flow

### Overview
The application follows a modular architecture with clear separation of concerns. Data flows through the following layers:

1. **Client Request** → Controller → Service → Repository/Entity → Database
2. **External API** (FX Rates) → Service → Cache → Client Response

### Detailed Flow

#### User Registration & Authentication Flow
1. User sends registration request to `/auth/register`.
2. `AuthController` validates input and calls `AuthService.register()`.
3. `AuthService` creates user entity, generates OTP, seeds wallet balances, sends email.
4. User verifies OTP via `/auth/verify`, receives JWT token.
5. Subsequent requests use JWT for authentication via `AuthGuard`.

#### Wallet Operations Flow
1. Authenticated user requests wallet operations (e.g., `/wallet/convert`).
2. `WalletController` validates request and calls `WalletService.convert()`.
3. `WalletService` fetches FX rate from `FxService`, performs atomic transaction:
   - Locks and updates source balance.
   - Updates or creates destination balance.
   - Logs transaction in `Transaction` entity.
4. Response includes conversion details and transaction ID.

#### FX Rate Fetching Flow
1. `FxService` periodically fetches rates from exchangerate-api.com.
2. Rates are cached in-memory (Map) for 5 minutes.
3. Services request rates via `FxService.getRate()`, which returns cached or fresh data.
4. Cached rates are filtered to supported currencies for API responses.

#### Data Entities & Relationships
- **User**: Central entity with email, password, verification status.
  - One-to-Many: WalletBalance, Transaction.
- **WalletBalance**: Per-currency balance per user (indexed for performance).
- **Transaction**: Immutable log of all operations (funding, conversions).

#### Security & Validation
- JWT tokens validated on protected routes.
- DTOs ensure input validation.
- Atomic transactions prevent race conditions.
- Bcrypt for password hashing, OTP hashing.

#### Caching & Performance
- FX rates cached in-memory; scalable to Redis.
- Database indexes on user_id, currency for fast queries.
- Pessimistic locking for balance updates.

## API Documentation

### Authentication Endpoints

- `POST /auth/register` - Register user and send OTP email.
- `POST /auth/verify` - Verify OTP and activate account.
- `POST /auth/resend-otp` - Resend OTP.
- `POST /auth/login` - Login and get JWT token.
- `POST /auth/logout` - Logout (client-side token removal).

### Wallet Endpoints

- `GET /wallet` - Get all wallet balances (optional ?currency=NGN filter).
- `POST /wallet/fund` - Fund wallet in NGN or other currencies.
- `POST /wallet/convert` - Convert between currencies.
- `POST /wallet/trade` - Trade NGN with other currencies (alias for convert).
- `GET /wallet/transactions` - Get transaction history.

### FX Endpoints

- `GET /fx/rates` - Get current FX rates (filtered to supported pairs).

### Example Requests

**Register:**
```json
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Verify:**
```json
POST /auth/verify
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Fund Wallet:**
```json
POST /wallet/fund
{
  "currency": "NGN",
  "amount": 10000
}
```

**Convert:**
```json
POST /wallet/convert
{
  "fromCurrency": "NGN",
  "toCurrency": "USD",
  "amount": 1000
}
```

## Architectural Decisions

- **Modular Structure**: Separate modules for Auth, Wallet, FX.
- **Entity Design**: User, WalletBalance, Transaction entities with TypeORM.
- **Service Layer**: Business logic in services, controllers handle HTTP.
- **Validation**: Class-validator for DTOs.
- **Error Handling**: Global exception filters.
- **Caching**: In-memory for FX rates; Redis optional for scalability.
- **Security**: Bcrypt for passwords, JWT for auth, guards for protected routes.
- **Database**: PostgreSQL for transactions; indexes on user_id, currency.
- **Scalability**: Stateless design, easy to add microservices or Redis.

## Running Tests

```bash
# All tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

All 21 tests pass, covering services, controllers, and auth.

## Deployment

- Use Docker for containerization.
- Configure environment variables for production.
- Set up database backups and monitoring.
- For high traffic, add Redis caching and load balancing.



