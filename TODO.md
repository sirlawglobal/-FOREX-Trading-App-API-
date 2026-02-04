# TODO: Implement Role-Based Access Control

## Step 1: Define Role Enum ✅
- Create `src/auth/roles.enum.ts` with role constants (e.g., USER, ADMIN).

## Step 2: Update User Entity ✅
- Add `role` column to `src/entities/user.entity.ts` (enum type, default to USER).

## Step 3: Create Roles Decorator
- Create `src/auth/roles.decorator.ts` for @Roles() decorator.

## Step 4: Create Roles Guard
- Create `src/auth/roles.guard.ts` to check user roles against required roles.

## Step 5: Update JWT Strategy
- Modify `src/auth/jwt.strategy.ts` to include role in JWT payload.

## Step 6: Update Auth Service
- Update `src/auth/auth.service.ts` to assign default role during registration.

## Step 7: Apply Guards to Controllers
- Update `src/wallet/wallet.controller.ts` to use RolesGuard where needed.
- Optionally update `src/fx/fx.controller.ts` if role protection is required.

## Step 8: Run Migration
- Execute database migration to add role column.

## Step 9: Test Implementation
- Test role-protected endpoints with different user roles.
- Update Swagger docs if necessary.

## Step 10: Create Roles Decorator
- Create `src/auth/roles.decorator.ts` for @Roles() decorator.

## Step 11: Create Roles Guard
- Create `src/auth/roles.guard.ts` to check user roles against required roles.

## Step 12: Update JWT Strategy
- Modify `src/auth/jwt.strategy.ts` to include role in JWT payload.

## Step 13: Update Controllers with Role Guards
- Update `src/wallet/wallet.controller.ts` to use RolesGuard with @Roles(Role.USER).
- Update `src/fx/fx.controller.ts` to use RolesGuard with @Roles(Role.USER) for /fx/rates.

## Step 14: Create Admin Module
- Create `src/admin/admin.controller.ts`, `admin.service.ts`, `admin.module.ts`.
- Implement admin endpoints with @Roles(Role.ADMIN).
- Update `src/app.module.ts` to import admin module.
