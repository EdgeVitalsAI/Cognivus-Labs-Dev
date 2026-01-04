# Cognivus Health Monitoring System - Backend

Secure FastAPI backend with PostgreSQL database and JWT authentication for the Cognivus Health Monitoring System.

## Features

- **FastAPI** - Modern, fast web framework for building APIs
- **PostgreSQL** - Production-grade relational database
- **JWT Authentication** - Secure token-based authentication with access and refresh tokens
- **Role-Based Access Control** - Separate authentication for doctors and staff
- **Docker Support** - Fully containerized application
- **User Management** - CLI tool for managing users
- **Password Hashing** - Bcrypt for secure password storage
- **CORS Support** - Configured for frontend integration

## Technology Stack

- Python 3.11
- FastAPI 0.109.2
- PostgreSQL 15
- SQLAlchemy 2.0.27
- JWT (python-jose)
- Bcrypt & Passlib
- Docker & Docker Compose

## Quick Start with Docker (Recommended)

### Prerequisites

- Docker
- Docker Compose

### 1. Environment Setup

The `.env` file is already configured with default values. For production, update these values:

```env
# Security - CHANGE THESE IN PRODUCTION!
SECRET_KEY=your-super-secret-key-min-32-characters
REFRESH_SECRET_KEY=your-refresh-secret-key-min-32-characters

# PostgreSQL Database
POSTGRES_PASSWORD=your-secure-password
```

### 2. Start the Application

```bash
# Start all services (PostgreSQL + Backend + PgAdmin)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: This deletes the database!)
docker-compose down -v
```

### 3. Access the Application

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **PgAdmin** (Database Admin): http://localhost:5050
  - Email: admin@cognivuslabs.com
  - Password: admin

### 4. Default Demo Credentials

The database is automatically initialized with demo users:

**Doctor Login:**
- Email: `doctor@cognivuslabs.com`
- Password: `doctor123`

**Staff Login:**
- Email: `staff@cognivuslabs.com`
- Password: `staff123`

## Manual Setup (Without Docker)

### Prerequisites

- Python 3.11+
- PostgreSQL 15+

### 1. Install PostgreSQL

Install PostgreSQL and create a database:

```bash
# Create database
createdb cognivus_auth

# Create user
psql -c "CREATE USER cognivus_user WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE cognivus_auth TO cognivus_user;"
```

### 2. Setup Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

Update the `.env` file with your PostgreSQL connection details:

```env
POSTGRES_HOST=localhost
POSTGRES_USER=cognivus_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=cognivus_auth
```

### 4. Initialize Database

```bash
python init_db.py
```

### 5. Run the Application

```bash
# Development mode (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## User Management

Use the interactive user management script to add, list, activate, deactivate, or delete users:

```bash
# Inside Docker container
docker-compose exec backend python manage_users.py

# Without Docker
python manage_users.py
```

### User Management Menu

1. **Add new user** - Create a new doctor or staff account
2. **List all users** - View all users in the database
3. **Deactivate user** - Disable a user account
4. **Activate user** - Enable a user account
5. **Delete user** - Permanently remove a user
6. **Exit** - Close the management tool

## API Endpoints

### Authentication

#### POST `/api/auth/doctor/login`
Login for doctors

**Request:**
```json
{
  "email": "doctor@cognivuslabs.com",
  "password": "doctor123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "doctor@cognivuslabs.com",
    "full_name": "Sarah Anderson",
    "role": "doctor",
    "specialty": "Cardiology",
    "license_number": "MD-2024-001",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00"
  }
}
```

#### POST `/api/auth/staff/login`
Login for staff members (same format as doctor login)

#### POST `/api/auth/refresh`
Refresh access token using refresh token

**Request:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response:** Same as login response with new tokens

#### GET `/api/auth/verify`
Verify current access token (requires authentication)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 1,
  "email": "doctor@cognivuslabs.com",
  "full_name": "Sarah Anderson",
  "role": "doctor",
  ...
}
```

### Health Check

#### GET `/health`
Check if the API is healthy

#### GET `/`
Get API information

## Security Features

### JWT Token Strategy

1. **Access Token** - Short-lived (30 minutes)
   - Used for API authentication
   - Stored in localStorage
   - Automatically refreshed when expired

2. **Refresh Token** - Long-lived (7 days)
   - Used to obtain new access tokens
   - Stored in localStorage
   - Rotated on each refresh

### Password Security

- Bcrypt hashing with automatic salt generation
- Passwords never stored in plain text
- Minimum password length enforced

### Role-Based Access Control

- Separate login endpoints for doctors and staff
- Role verification in JWT token
- Middleware enforces role-based access

## Database Schema

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| email | String | Unique email address |
| hashed_password | String | Bcrypt hashed password |
| full_name | String | User's full name |
| role | Enum | "doctor" or "staff" |
| is_active | Boolean | Account status |
| created_at | DateTime | Account creation time |
| updated_at | DateTime | Last update time |
| specialty | String | Doctor's specialty (doctors only) |
| license_number | String | Medical license (doctors only) |
| department | String | Department name (staff only) |
| employee_id | String | Employee ID (staff only) |

## Development

### Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       └── auth.py          # Authentication endpoints
│   ├── core/
│   │   ├── config.py            # Configuration settings
│   │   ├── database.py          # Database connection
│   │   └── security.py          # Security utilities
│   ├── middleware/
│   │   └── auth.py              # Authentication middleware
│   ├── models/
│   │   └── user.py              # User database model
│   ├── schemas/
│   │   └── user.py              # Pydantic schemas
│   ├── services/
│   │   └── auth.py              # Authentication service
│   └── main.py                  # FastAPI application
├── Dockerfile                   # Docker configuration
├── docker-compose.yml           # Docker Compose configuration
├── .dockerignore                # Docker ignore file
├── init_db.py                   # Database initialization script
├── manage_users.py              # User management CLI
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables
└── README.md                    # This file
```

### Running Tests

```bash
# TODO: Add pytest tests
pytest
```

### Database Migrations

For schema changes, use Alembic:

```bash
# Initialize Alembic (first time only)
alembic init alembic

# Create a migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Docker Services

### Backend Service
- **Port**: 8000
- **Auto-reload**: Enabled in development
- **Health check**: Configured

### PostgreSQL Service
- **Port**: 5432
- **Volume**: Persistent data storage
- **Health check**: Configured

### PgAdmin Service (Optional)
- **Port**: 5050
- **Purpose**: Database administration
- **Access**: http://localhost:5050

## Production Deployment

### Environment Variables

Ensure these are properly configured for production:

```env
DEBUG=False
SECRET_KEY=<strong-random-key-min-32-chars>
REFRESH_SECRET_KEY=<different-strong-random-key>
POSTGRES_PASSWORD=<strong-database-password>
ALLOWED_ORIGINS=https://yourdomain.com
```

### Security Checklist

- [ ] Change all default passwords
- [ ] Use strong, unique SECRET_KEY and REFRESH_SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configure proper CORS origins
- [ ] Use HTTPS in production
- [ ] Set up database backups
- [ ] Enable firewall rules
- [ ] Use environment-specific .env files
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging

### Scaling

For production, increase worker count:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Or use the docker-compose production configuration:

```yaml
command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Connect to PostgreSQL container
docker-compose exec postgres psql -U cognivus_user -d cognivus_auth
```

### Backend Issues

```bash
# View backend logs
docker-compose logs -f backend

# Restart backend
docker-compose restart backend

# Rebuild backend
docker-compose up -d --build backend
```

### Reset Database

```bash
# Stop services and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## License

Copyright 2024 Cognivus Labs

## Support

For issues and questions, please contact the development team.
