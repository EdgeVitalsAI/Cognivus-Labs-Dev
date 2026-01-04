# Cognivus Health Monitoring System - Setup Guide

Complete setup guide for the Cognivus Health Monitoring System web application.

## Overview

This is a full-stack health monitoring system with:
- **Backend**: FastAPI + PostgreSQL (Dockerized)
- **Frontend**: React + Vite
- **Authentication**: JWT with access and refresh tokens
- **Roles**: Doctor and Staff with separate dashboards

## Quick Start (Recommended)

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend)
- npm or yarn

### Step 1: Start Backend Services

```bash
cd backend

# Start PostgreSQL + Backend + PgAdmin
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f backend
```

The backend will:
- Start PostgreSQL database
- Initialize database tables
- Create demo users
- Start API server on http://localhost:8000

**API Documentation**: http://localhost:8000/docs

### Step 2: Start Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Frontend URL**: http://localhost:3000

### Step 3: Login

**Doctor Dashboard:**
- URL: http://localhost:3000/doctor/login
- Email: `doctor@cognivuslabs.com`
- Password: `doctor123`

**Staff Dashboard:**
- URL: http://localhost:3000/staff/login
- Email: `staff@cognivuslabs.com`
- Password: `staff123`

## Services Overview

### Backend (Port 8000)
- FastAPI REST API
- JWT authentication
- PostgreSQL database
- Role-based access control

### Frontend (Port 3000)
- React 18 with Vite
- Tailwind CSS
- Role-based routing
- Automatic token refresh

### Database (Port 5432)
- PostgreSQL 15
- Separate database for auth
- Persistent storage

### PgAdmin (Port 5050) - Optional
- Database administration UI
- URL: http://localhost:5050
- Email: admin@cognivuslabs.com
- Password: admin

## User Management

### Add New Users

```bash
# Inside Docker container
docker-compose -f backend/docker-compose.yml exec backend python manage_users.py
```

The interactive menu allows you to:
1. Add new doctor or staff accounts
2. List all users
3. Activate/deactivate accounts
4. Delete users

### Manual User Creation

You can also add users programmatically:

```python
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()

# Create a doctor
doctor = User(
    email="newdoctor@example.com",
    hashed_password=get_password_hash("password123"),
    full_name="Dr. John Doe",
    role=UserRole.DOCTOR,
    specialty="Neurology",
    license_number="MD-2024-002"
)
db.add(doctor)
db.commit()
```

## Architecture

### Authentication Flow

1. **Login**
   - User submits email/password to `/api/auth/doctor/login` or `/api/auth/staff/login`
   - Backend validates credentials
   - Returns access token (30 min) and refresh token (7 days)
   - Frontend stores tokens in localStorage

2. **API Requests**
   - Frontend includes access token in `Authorization: Bearer <token>` header
   - Backend validates token and role
   - Returns requested data

3. **Token Refresh**
   - When access token expires (401 error)
   - Frontend automatically uses refresh token to get new access token
   - Seamless experience for user

4. **Logout**
   - Frontend clears all tokens from localStorage
   - Redirects to login page

### Security Features

- **Password Hashing**: Bcrypt with automatic salt
- **JWT Tokens**: Separate access and refresh tokens
- **Token Rotation**: New refresh token on each refresh
- **Role Verification**: Backend enforces role-based access
- **CORS**: Configured for localhost development
- **HTTPS Ready**: Use in production with SSL

## Development

### Backend Development

```bash
cd backend

# Start with hot reload
docker-compose up

# Run without Docker
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload

# Add new API endpoint
# 1. Create route in app/api/routes/
# 2. Add schema in app/schemas/
# 3. Add service logic in app/services/
# 4. Register router in app/main.py
```

### Frontend Development

```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Add new page
# 1. Create component in src/pages/
# 2. Add route in src/App.jsx
# 3. Use ProtectedRoute for authenticated pages
```

### Database Changes

```bash
cd backend

# Connect to database
docker-compose exec postgres psql -U cognivus_user -d cognivus_auth

# View tables
\dt

# View users
SELECT email, role, is_active FROM users;

# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d
```

## Production Deployment

### Environment Configuration

Create separate `.env` files for production:

**Backend `.env`:**
```env
DEBUG=False
SECRET_KEY=<generate-strong-random-key-min-32-chars>
REFRESH_SECRET_KEY=<generate-different-strong-key>
POSTGRES_PASSWORD=<strong-database-password>
POSTGRES_HOST=postgres
ALLOWED_ORIGINS=https://yourdomain.com
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

**Frontend `.env.production`:**
```env
VITE_API_URL=https://api.yourdomain.com
```

### Build & Deploy

```bash
# Backend - Use docker-compose with production config
cd backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Frontend - Build and serve
cd frontend
npm run build
# Serve dist/ folder with nginx or similar
```

### Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong SECRET_KEY and REFRESH_SECRET_KEY
- [ ] Set DEBUG=False in backend
- [ ] Configure proper CORS origins
- [ ] Use HTTPS/SSL certificates
- [ ] Set up database backups
- [ ] Enable firewall rules
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging
- [ ] Use environment variables for secrets

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose -f backend/docker-compose.yml logs backend

# Common issues:
# 1. PostgreSQL not ready - wait a few seconds
# 2. Port 8000 in use - stop other services
# 3. Environment variables missing - check .env file
```

### Frontend login fails

```bash
# Check backend is running
curl http://localhost:8000/health

# Check API URL in frontend
# Should be http://localhost:8000 in development

# Clear browser localStorage
# Open DevTools > Application > Local Storage > Clear All

# Check network tab for API errors
```

### Database connection issues

```bash
# Check PostgreSQL is running
docker-compose -f backend/docker-compose.yml ps postgres

# Connect to database
docker-compose -f backend/docker-compose.yml exec postgres psql -U cognivus_user -d cognivus_auth

# Check credentials match .env file
```

### Token expires too quickly

Adjust in `backend/.env`:
```env
ACCESS_TOKEN_EXPIRE_MINUTES=30  # Increase if needed
REFRESH_TOKEN_EXPIRE_DAYS=7     # Increase if needed
```

## API Endpoints Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/doctor/login` | Doctor login | No |
| POST | `/api/auth/staff/login` | Staff login | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| GET | `/api/auth/verify` | Verify token | Yes |

### Health

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | API info | No |
| GET | `/health` | Health check | No |

## Tech Stack Summary

### Backend
- **Framework**: FastAPI 0.109.2
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0.27
- **Authentication**: JWT (python-jose)
- **Password**: bcrypt + passlib
- **Server**: Uvicorn
- **Containerization**: Docker + Docker Compose

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.1.4
- **Routing**: React Router 6.22.0
- **Styling**: Tailwind CSS 3.4.1
- **HTTP Client**: Axios 1.6.7
- **Icons**: Lucide React

## File Structure

```
web-app/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # API endpoints
│   │   ├── core/            # Core configuration
│   │   ├── middleware/      # Authentication middleware
│   │   ├── models/          # Database models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── main.py          # FastAPI app
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── init_db.py           # Database initialization
│   ├── manage_users.py      # User management CLI
│   ├── requirements.txt
│   ├── .env
│   └── README.md
│
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── pages/           # Page components
    │   ├── services/        # API services
    │   └── App.jsx          # Main app
    ├── package.json
    └── vite.config.js
```

## Next Steps

1. Start both backend and frontend
2. Login with demo credentials
3. Explore the dashboards
4. Add new users using the management script
5. Customize for your needs

## Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation at http://localhost:8000/docs
- Check Docker logs: `docker-compose logs`

---

**Happy coding!**
