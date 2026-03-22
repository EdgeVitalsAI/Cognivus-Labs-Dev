from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional

from ...core.database import get_db
from ...core.security import verify_password, create_access_token, create_refresh_token
from ...models.admin import Admin

router = APIRouter()

# Separate OAuth2 scheme for admin
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/sys/auth/login")


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    admin: dict


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(
    form_data: AdminLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Admin login endpoint with enhanced security"""

    # Find admin by username
    admin = db.query(Admin).filter(Admin.username == form_data.username).first()

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Check if account is locked
    if admin.locked_until and admin.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is temporarily locked. Try again later."
        )

    # Verify password
    if not verify_password(form_data.password, admin.hashed_password):
        # Increment failed attempts
        admin.failed_login_attempts += 1

        # Lock account after 5 failed attempts for 30 minutes
        if admin.failed_login_attempts >= 5:
            admin.locked_until = datetime.utcnow() + timedelta(minutes=30)

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Check if active
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is deactivated"
        )

    # Reset failed attempts and update login info
    admin.failed_login_attempts = 0
    admin.locked_until = None
    admin.last_login = datetime.utcnow()
    admin.last_ip = request.client.host
    db.commit()

    # Create tokens with admin role
    access_token = create_access_token(
        data={
            "sub": admin.username,
            "admin_id": admin.id,
            "role": "admin",
            "is_super": admin.is_super_admin
        }
    )
    refresh_token = create_refresh_token(
        data={
            "sub": admin.username,
            "admin_id": admin.id,
            "role": "admin"
        }
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "admin": {
            "id": admin.id,
            "username": admin.username,
            "full_name": admin.full_name,
            "email": admin.email,
            "is_super_admin": admin.is_super_admin
        }
    }


@router.post("/refresh")
async def refresh_admin_token(refresh_token: str, db: Session = Depends(get_db)):
    """Refresh admin access token"""
    from ...core.security import decode_refresh_token

    payload = decode_refresh_token(refresh_token)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    username = payload.get("sub")
    admin = db.query(Admin).filter(Admin.username == username).first()

    if not admin or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin"
        )

    access_token = create_access_token(
        data={
            "sub": admin.username,
            "admin_id": admin.id,
            "role": "admin",
            "is_super": admin.is_super_admin
        }
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
async def get_current_admin(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Get current admin info"""
    from ...core.security import decode_access_token

    payload = decode_access_token(token)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    admin_id = payload.get("admin_id")
    admin = db.query(Admin).filter(Admin.id == admin_id).first()

    if not admin or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin"
        )

    return {
        "id": admin.id,
        "username": admin.username,
        "full_name": admin.full_name,
        "email": admin.email,
        "is_super_admin": admin.is_super_admin,
        "last_login": admin.last_login
    }
