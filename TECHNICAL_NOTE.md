# Technical Design Note: Attendance Management Module

---

## Overview

This document outlines the technical architecture, design decisions, and assumptions for the Attendance Management Module — a business-ready HR workflow system built with React + Vite (frontend), Node.js/Express (backend), and PostgreSQL (database).

---

## Architecture

### Client-Server Split

#### Frontend (React 19 + Vite 8)

- Handles UI rendering, user interactions, and API calls via Axios.
- Uses Material UI v9 and Tailwind CSS v4 for styling and components.
- Implements React Router v7 with layout routes (`<Outlet />`) and `ProtectedRoute` for role-based access.
- Unauthorized role access redirects to a dedicated `/unauthorized` page rather than a generic error.
- All API calls go through a single Axios instance (`src/api/index.js`) with JWT interceptors. The token is stored in `localStorage` under the key `auth_token`.
- Environment variables use the `VITE_*` prefix via `import.meta.env` (Vite convention).

#### Backend (Express)

- Implements RESTful APIs for all business logic.
- Uses Sequelize ORM with `sync({ alter: true })` — schema is auto-applied on startup; no migration CLI needed.
- Enforces JWT authentication (`verifyToken`) and role-based authorization (`requireRole` / `requireRoles`) via middleware.

#### Database (PostgreSQL)

- Stores all data in a normalized schema with foreign key constraints.
- Seed data (roles and default test users) is loaded by running `npm run seed` from the `server/` directory.

#### Why this split?

- Separation of concerns: frontend and backend can evolve independently.
- Stateless backend enables horizontal scaling.
- Clear layer boundaries aid maintainability and testing.

---

### MVC Pattern (Backend)

- **Models**: Define database tables and relationships (`User`, `AttendanceRecord`, `CorrectionRequest`, etc.).
- **Controllers**: Handle HTTP request/response logic (`authController`, `attendanceController`, `correctionController`, `adminController`).
- **Routes**: Map endpoints to controllers (`auth.routes.js`, `attendance.routes.js`, etc.).
- **Middleware**: Enforce authentication (`verifyToken`) and authorization (`requireRole` / `requireRoles`).

---

### Frontend Structure

- **Context API** (`AuthContext`): Global auth state — user object, login/logout, token refresh.
- **ProtectedRoute**: Role-based route guard; redirects unauthenticated users to `/login` and unauthorized roles to `/unauthorized`.
- **Reusable Components**: `Button`, `Modal`, `Table`, `Badge`, `Spinner` in `src/components/common/`.
- **API Layer** (`src/api/index.js`): Centralized Axios instance; attaches `Authorization: Bearer <token>` to every request; handles 401 by clearing stored credentials and redirecting to login.

---

## Authentication & Authorization

### JWT Authentication Flow

1. User submits email + password to `POST /api/auth/login`.
2. Backend validates credentials, checks account is active, and returns:
   - `token` — short-lived access token (1 hour), payload: `{ userId, name, email, role }`.
   - `refreshToken` — long-lived refresh token (7 days).
   - `expiresIn` — token lifetime in seconds.
   - `user` — safe user object (no password hash).
3. Frontend stores `token` as `auth_token`, `refreshToken` as `refresh_token` in `localStorage`.
4. Axios interceptor attaches `Authorization: Bearer <token>` to every subsequent request.
5. On 401 response, frontend clears stored credentials and redirects to login.
6. Clients can call `POST /api/auth/refresh-token` with the refresh token to obtain a new access token without re-authenticating.

**Security considerations:**

- JWT is signed with a secret key from `.env` (`JWT_SECRET`, `JWT_REFRESH_SECRET`).
- Access tokens are short-lived (1 hour) to limit exposure from token theft.
- Inactive users are rejected at login before a token is issued.

### Role-Based Authorization

Every protected route is guarded by the middleware chain:

1. `verifyToken` — verifies and decodes the JWT, attaches `req.user.userId` and `req.user.role`.
2. `requireRole(role)` or `requireRoles([roles])` — checks the decoded role against allowed roles, returns 403 if unauthorized.

Even if a user guesses a URL, the backend rejects the request at the middleware layer.

---

## Database Design

### Schema Overview

| Table | Purpose |
| --- | --- |
| Roles | Defines roles: `employee`, `hr`, `admin` |
| Users | Stores user details (name, email, password_hash, role_id, department, position) |
| AttendanceRecords | Tracks clock-in/out times, status, and total hours per user per day |
| CorrectionRequests | Stores correction requests (type, date, corrected_time, reason, status) |
| AttendanceRules | Configurable rules (work hours, late threshold, break duration, overtime, is_active) |
| AuditLogs | Logs all mutations with actor, action, target table, old/new values, and IP address |

### Key Design Decisions

#### Normalized Schema

- Foreign keys (e.g., `user_id` in `AttendanceRecords`) ensure data integrity.
- Role names live in `Roles` and are referenced by `Users`, avoiding duplication.

#### Sequelize Association Aliases

- `CorrectionRequest` has two `belongsTo(User)` relationships: `as: 'User'` (the requester) and `as: 'Reviewer'` (the HR/admin approver). Explicit aliases are required to avoid ambiguous query errors.
- `AttendanceRecord.belongsTo(User, { as: 'User' })` is similarly aliased for HR/admin views.

#### AuditLogs Table

- Decoupled from business logic; every mutation calls `auditLogger()` with actor ID, action type, target table, and before/after JSON snapshots.
- Captures `old_value` and `new_value` as JSON for full change history.
- Actor information is retrieved via the included `User` association (`log.User.name`, `log.User.email`).

#### AttendanceRules Table

- Rules are configurable at runtime (not hardcoded) to support different work schedules without code changes.
- Fields: `work_start_time`, `work_end_time`, `min_hours_per_day`, `late_threshold_minutes`, `break_duration_minutes`, `overtime_threshold_hours`, `is_active`.

---

## Security Measures

| Measure | Implementation |
| --- | --- |
| JWT Authentication | Short-lived tokens (1h) signed with a server-side secret |
| Role-Based Access | Middleware checks roles on every protected route |
| Input Validation | `express-validator` on all request bodies |
| SQL Injection | Sequelize ORM uses parameterized queries throughout |
| Rate Limiting | `express-rate-limit` on the login endpoint (brute-force protection) |
| Security Headers | `helmet` middleware sets HTTP security headers |
| CORS | Origins whitelisted via `CORS_ORIGIN` env var (defaults: `localhost:3000`, `localhost:5173`) |
| Password Hashing | `bcrypt` with salt rounds = 10 |
| Audit Logging | Every mutation is logged with actor, timestamp, and diff |

---

## Business Logic & Validations

### Clock-In / Clock-Out Rules

- **Employee only**: clock-in and clock-out endpoints are restricted to the `employee` role. HR and Admin users see an informational message on the dashboard instead of action buttons.
- **One action per day**: checks for an existing `AttendanceRecord` for `(user_id, date)` before creating.
- **Time sequence**: `clock_out_time` must be after `clock_in_time`; enforced server-side.
- **Status**: automatically set to `present` on clock-in; `total_hours` computed on clock-out.

### Correction Request Rules

- **Employee only**: only employees can submit correction requests and view their own.
- **No duplicate pending requests**: blocks multiple pending requests for the same `(user_id, date, request_type)`.
- **HR / Admin approval workflow**: both HR and Admin can approve or reject correction requests. Approving updates the linked `AttendanceRecord` with the corrected time and recalculates `total_hours`. The field updated (`clock_in_time` vs `clock_out_time`) is determined by `request.request_type`.
- **Status guard**: double-approval/rejection is rejected with a 400 error.

### Admin Workflow

- **User management**: CRUD with password excluded from all API responses.
- **Role assignment**: only admins can change roles; all changes are audit-logged.
- **Audit trail**: every admin mutation records actor, action, target, and before/after state.

---

## Frontend Library Notes

### Material UI v9 Grid API

The project uses the current MUI v9 Grid API with the `size` prop:

```jsx
// Correct (MUI v9)
<Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
```

The legacy `item` / `xs` / `sm` / `md` prop API was removed in MUI v6+.

### Date Picker Adapter

MUI v9 (`@mui/x-date-pickers` v9) ships a single `AdapterDateFns` that is compatible with `date-fns` v4. Import it directly from the `AdapterDateFns` path:

```js
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
```

There is no separate `AdapterDateFnsV3` module in this version.

---

## Assumptions

### Single Timezone

All times are stored in UTC and converted to local time in the frontend. Timezone-per-user support is a future improvement.

### No Shift Scheduling

A single work schedule is defined in `AttendanceRules`. Multiple shifts (morning/night) are a future improvement.

### No Multi-Company Support

The schema is designed to support adding `company_id` to all tables without breaking existing queries.

### No Email Notifications

Correction approvals and rejections are not emailed. Integration with Nodemailer or a message queue (e.g., Bull) is a future improvement.

---

## Future Improvements

1. **Multi-Company Support** — add `company_id` to all tables; filter queries by company.
2. **Shift Scheduling** — extend `AttendanceRules` to support multiple shifts.
3. **Email Notifications** — send emails for correction requests, approvals, and rejections.
4. **Advanced Reporting** — attendance trend charts using a library like Recharts.
5. **Automated Testing** — unit tests (Jest) and integration tests (Supertest).
6. **Deployment** — Dockerize the app; add CI/CD via GitHub Actions.
7. **HttpOnly Cookies** — migrate refresh tokens from `localStorage` to `httpOnly` cookies.

---

## Conclusion

This Attendance Management Module is designed to be:

- **Maintainable** — modular code with clear separation of concerns.
- **Secure** — JWT with refresh tokens, role-based access, input validation, and audit logs.
- **Scalable** — normalized database, configurable rules, stateless backend.
- **Commercial-Ready** — audit trails, compliance-friendly, extensible schema.
