# Attendance Management Module

A **business-ready HR attendance workflow module** built with React, Node.js/Express, and PostgreSQL.
Employees clock in/out and raise correction requests; HR and Admin manage records, users, and rules.

---

## Features

### Employee Role

- Login/Logout with JWT authentication
- Clock-in and Clock-out (once per day)
- View today's attendance status on the Dashboard
- View full attendance history with filtering, sorting, and CSV export
- Raise correction requests (missed/wrong clock-in/out)
- Track correction request status (Pending / Approved / Rejected)

### HR Role

- Review all employee correction requests
- Approve/Reject with reviewer remarks
- View all employees' attendance records with filtering and CSV export

### Admin Role

- User management (create, update, delete, activate/deactivate)
- Role assignment (employee / hr / admin)
- Attendance rules setup (work hours, late thresholds, break duration, overtime)
- Audit log viewer with filtering, sorting, and CSV export

---

## Tech Stack

| Layer        | Technology                                                          |
|--------------|---------------------------------------------------------------------|
| Frontend     | React 19, Vite 8, React Router v7, Axios                            |
| UI Library   | @mui/material v9, @mui/icons-material v9                            |
| Styling      | Tailwind CSS v4 (via @tailwindcss/vite)                             |
| Date Pickers | @mui/x-date-pickers v9 with date-fns v4 (AdapterDateFns)            |
| Forms        | Formik + Yup                                                        |
| Backend      | Node.js, Express                                                    |
| Database     | PostgreSQL with Sequelize ORM (sync alter:true)                     |
| Auth         | JWT access tokens (1h) + refresh tokens (7d)                        |
| Validation   | express-validator                                                   |
| Security     | bcrypt, helmet, cors, express-rate-limit                            |

---

## Prerequisites

- Node.js v18 or higher
- PostgreSQL v14 or higher
- npm or yarn

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd attendance-management
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance_management
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_DIALECT=postgres

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

Start the server (database schema auto-syncs on startup):

```bash
npm run dev
```

Seed the database with roles and default test users (first time only):

```bash
npm run seed
```

The backend runs on <http://localhost:5000>.

### 3. Frontend Setup

```bash
cd ../client
npm install
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

The frontend runs on <http://localhost:5173>.

---

## Sample Credentials

| Role | Email | Password |
| --- | --- | --- |
| Employee | `emp@test.com` | `Test@1234` |
| HR | `hr@test.com` | `Test@1234` |
| Admin | `admin@test.com` | `Test@1234` |

---

## API Endpoints

### Auth

| Endpoint                  | Method | Description                        | Access        |
|---------------------------|--------|------------------------------------|---------------|
| /api/auth/login           | POST   | Login, returns JWT + refresh token | Public        |
| /api/auth/logout          | POST   | Logout                             | Authenticated |
| /api/auth/me              | GET    | Get current user profile           | Authenticated |
| /api/auth/refresh-token   | POST   | Refresh access token               | Public        |
| /api/auth/profile         | PATCH  | Update own profile                 | Authenticated |
| /api/auth/change-password | POST   | Change own password                | Authenticated |

### Attendance

| Endpoint                  | Method | Description                  | Access                |
|---------------------------|--------|------------------------------|-----------------------|
| /api/attendance/clock-in  | POST   | Clock in for today           | Employee              |
| /api/attendance/clock-out | POST   | Clock out for today          | Employee              |
| /api/attendance/today     | GET    | Today's attendance record    | Employee / HR / Admin |
| /api/attendance/history   | GET    | Paginated attendance history | Employee / HR / Admin |

### Correction Requests

| Endpoint                     | Method | Description                  | Access          |
|------------------------------|--------|------------------------------|-----------------|
| /api/corrections             | POST   | Create a correction request  | Employee        |
| /api/corrections/mine        | GET    | Own correction requests      | Employee        |
| /api/corrections             | GET    | All correction requests      | HR / Admin      |
| /api/corrections/:id/approve | PATCH  | Approve a correction request | HR / Admin      |
| /api/corrections/:id/reject  | PATCH  | Reject a correction request  | HR / Admin      |

### Admin

| Endpoint                  | Method         | Description                         | Access          |
|---------------------------|----------------|-------------------------------------|-----------------|
| /api/admin/users          | GET / POST     | List or create users                | Admin           |
| /api/admin/users/:id      | PATCH / DELETE | Update or delete a user             | Admin           |
| /api/admin/users/:id/role | PATCH          | Assign a role to a user             | Admin           |
| /api/admin/roles          | GET            | List all available roles            | Admin           |
| /api/admin/rules          | GET / POST     | List or create attendance rules     | Admin           |
| /api/admin/rules/:id      | PUT / DELETE   | Update or delete an attendance rule | Admin           |
| /api/admin/audit-logs     | GET            | View audit logs                     | Admin           |
| /api/admin/attendance     | GET            | View all attendance records         | HR / Admin      |

---

## Project Structure

```text
attendance-management/
├── client/                       # React + Vite Frontend
│   ├── public/
│   └── src/
│       ├── api/                  # Axios instance + all API calls
│       ├── components/
│       │   ├── common/           # Button, Modal, Table, Badge, Spinner
│       │   └── layout/           # Navbar, Sidebar, PageWrapper
│       ├── context/              # AuthContext (JWT state + refresh)
│       ├── guards/               # ProtectedRoute (role-based access)
│       ├── pages/
│       │   ├── auth/             # Login, Unauthorized
│       │   ├── employee/         # Dashboard, AttendanceHistory, CorrectionRequest
│       │   ├── hr/               # CorrectionRequests, AttendanceView
│       │   └── admin/            # UserManagement, RoleAssignment, AttendanceRules, AuditLogs
│       ├── routes/               # AppRouter (React Router v7)
│       └── App.jsx
│
├── server/                       # Express Backend
│   ├── config/                   # Sequelize database config
│   ├── controllers/              # authController, attendanceController, etc.
│   ├── middleware/               # verifyToken, requireRole / requireRoles, errorHandler
│   ├── models/                   # Sequelize models + associations
│   ├── routes/                   # auth, attendance, corrections, admin
│   ├── seeders/                  # Seed scripts (roles + default users)
│   ├── utils/                    # auditLogger, validators
│   ├── app.js                    # Express app setup (CORS, middleware, routes)
│   └── server.js                 # Entry point (DB connect, sync, listen)
│
├── README.md
└── TECHNICAL_NOTE.md
```

---

## Testing

### Manual Testing

- Login with any sample credential above.
- As an **employee**: clock in, clock out, view history, submit a correction request.
- As **HR**: approve or reject correction requests, view all attendance records.
- As **admin**: manage users, assign roles, configure attendance rules, view audit logs.

### Automated Testing (Future)

- Backend unit tests with Jest + Supertest
- Frontend component tests with React Testing Library

---

## License

This project is licensed under the **MIT License**.
