# AssetHub — Smart Asset Management Platform

> A full-stack asset management and resource allocation platform built for the Cultural Council of IIT Roorkee.

---

## Project Overview

AssetHub is a centralized platform for managing shared resources such as DSLR cameras, audio equipment, lighting gear, costumes, and stage props. It supports two roles:

- **Admin** — Manages inventory, approves/rejects booking requests, issues and returns assets, views analytics
- **User** — Browses assets, submits booking requests, tracks request status, views history

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Charts | Recharts |
| Backend | Node.js, Express.js |
| Database | SQLite (via Prisma ORM) |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Deployment | Docker + Docker Compose |

---

## Feature List

### Mandatory Features
- [x] **User Authentication** — Register, Login, JWT sessions, role-based access (Admin/User)
- [x] **Inventory Management** — Add, edit, delete, categorize assets with quantity tracking
- [x] **Asset Discovery & Booking** — Browse, search, filter assets; book with date range and quantity
- [x] **Approval Workflow** — Admin approves/rejects requests with optional notes; users see status live
- [x] **Asset Issue & Return Management** — Admin marks assets as issued/returned; inventory auto-updates
- [x] **Analytics Dashboard** — Charts for utilization, bookings by status, trends, top assets
- [x] **Borrowing History** — Users see past bookings; admins see all activity

### Bonus Features
- [x] **Audit Logs** — Every action (create/approve/return/etc.) is logged with user and timestamp
- [x] **Asset Health Tracking** — Condition field (Excellent/Good/Fair/Poor) on every asset
- [x] **Dockerized Deployment** — Full Docker Compose setup for one-command deployment
- [x] **Demo Credentials** — Quick-fill buttons on login page for easy testing

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Git

### Method 1: Local Development (Recommended for development)

**Step 1: Clone the repository**
```bash
git clone https://github.com/Kushwant-mk/ASSET-MANAGEMENT.git
cd asset-management
```

**Step 2: Set up the backend**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
node src/utils/seed.js   # Creates demo data + admin/user accounts
```

**Step 3: Set up the frontend**
```bash
cd ../frontend
npm install
```

**Step 4: Run both servers**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Step 5: Open browser**
```
http://localhost:5173
```

---

### Method 2: Docker (One command)

```bash
git clone https://github.com/Kushwant-mk/ASSET-MANAGEMENT.git
cd asset-management
docker-compose up --build
```

Access at `http://localhost:3000`

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@iitroorkee.ac.in | admin123 |
| User 1 | arjun@iitroorkee.ac.in | user123 |
| User 2 | priya@iitroorkee.ac.in | user123 |

> **Tip:** The login page has one-click demo fill buttons.

---

## How to Verify Everything Is Working

### Backend Health Check
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"OK","message":"Asset Management API is running"}
```

### Test Auth
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@iitroorkee.ac.in","password":"admin123"}'
# Expected: {"message":"Login successful","user":{...},"token":"..."}
```

### Full Test Flow
1. Login as **admin** → See Dashboard with charts
2. Go to **Assets** → Add a new asset
3. Logout → Login as **user** (arjun@iitroorkee.ac.in / user123)
4. Browse assets → Click **Book Now** → Submit a booking request
5. Logout → Login as **admin**
6. Go to **All Bookings** → Approve the pending request
7. Click the **Issue** button (marks as physically handed out)
8. Click the **Return** button (marks as returned, quantity restored)
9. Check **Audit Logs** → See all actions recorded
10. Check **Dashboard** → See updated analytics

---

## Project Structure

```
asset-management/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # DB schema (User, Asset, Booking, AuditLog)
│   ├── src/
│   │   ├── controllers/         # Business logic
│   │   │   ├── auth.controller.js
│   │   │   ├── asset.controller.js
│   │   │   ├── booking.controller.js
│   │   │   └── analytics.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js   # JWT verification + admin guard
│   │   ├── routes/              # Express routers
│   │   ├── utils/
│   │   │   └── seed.js          # Demo data seeder
│   │   └── index.js             # Express app entry
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/          # Sidebar, Layout
    │   │   └── ui/              # StatusBadge, Spinner, BookingModal
    │   ├── context/
    │   │   └── AuthContext.jsx  # Global auth state
    │   ├── pages/               # Login, Register, Dashboard, Assets, Bookings...
    │   ├── utils/
    │   │   └── api.js           # Axios client with JWT interceptors
    │   └── App.jsx              # Routes + Protected routes
    └── package.json
```

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Register new user |
| POST | /api/auth/login | Public | Login, get JWT |
| GET | /api/auth/me | User | Get current user |
| GET | /api/assets | User | List assets with search/filter |
| POST | /api/assets | Admin | Create asset |
| PUT | /api/assets/:id | Admin | Update asset |
| DELETE | /api/assets/:id | Admin | Delete asset |
| GET | /api/bookings | User/Admin | List bookings |
| POST | /api/bookings | User | Request booking |
| PATCH | /api/bookings/:id/approve | Admin | Approve booking |
| PATCH | /api/bookings/:id/reject | Admin | Reject booking |
| PATCH | /api/bookings/:id/issue | Admin | Mark as issued |
| PATCH | /api/bookings/:id/return | Admin | Mark as returned |
| PATCH | /api/bookings/:id/cancel | User | Cancel own booking |
| GET | /api/analytics/dashboard | Admin | Full analytics |
| GET | /api/bookings/audit | Admin | Audit log |

---

## Architecture

```
Frontend (React + Vite)  ←→  Backend (Express.js)  ←→  SQLite (Prisma ORM)
     Port 5173                    Port 5000
```

- Stateless JWT auth — no sessions stored server-side
- Prisma transactions ensure inventory counts never go negative
- Role-based middleware guards every sensitive endpoint
- React Router v6 with protected route wrappers
