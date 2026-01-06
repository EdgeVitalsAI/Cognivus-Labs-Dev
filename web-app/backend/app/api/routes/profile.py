from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from ...core.database import get_db
from ...core.security import get_password_hash, verify_password
from ...models.user import User

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/doctor/login")


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


@router.get("/profile/me")
async def get_my_profile(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    from ...core.security import decode_access_token

    # Decode token to get user ID
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "phone": user.phone,
        "specialty": user.specialty,
        "license_number": user.license_number,
        "department": user.department,
        "employee_id": user.employee_id,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
        "last_login": user.last_login.isoformat() if user.last_login else None
    }


@router.patch("/profile/me")
async def update_my_profile(
    profile_data: ProfileUpdateRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    from ...core.security import decode_access_token

    # Decode token to get user ID
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # Update fields if provided
        if profile_data.full_name is not None:
            user.full_name = profile_data.full_name
        if profile_data.email is not None:
            # Check if email already exists
            existing_user = db.query(User).filter(
                User.email == profile_data.email,
                User.id != user_id
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            user.email = profile_data.email
        if profile_data.phone is not None:
            user.phone = profile_data.phone
        if profile_data.specialty is not None:
            user.specialty = profile_data.specialty
        if profile_data.license_number is not None:
            user.license_number = profile_data.license_number
        if profile_data.department is not None:
            user.department = profile_data.department
        if profile_data.employee_id is not None:
            user.employee_id = profile_data.employee_id

        user.updated_at = datetime.utcnow()
        db.commit()

        return {
            "status": "success",
            "message": "Profile updated successfully"
        }

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )


@router.post("/profile/change-password")
async def change_my_password(
    password_data: PasswordChangeRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Change current user's password"""
    from ...core.security import decode_access_token

    # Decode token to get user ID
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )

    try:
        user.hashed_password = get_password_hash(password_data.new_password)
        user.updated_at = datetime.utcnow()
        db.commit()

        return {
            "status": "success",
            "message": "Password changed successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )


@router.get("/profile/{user_id}")
async def get_user_profile(
    user_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get another user's profile (public info only)"""

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Return only public information
    return {
        "id": user.id,
        "full_name": user.full_name,
        "role": user.role,
        "specialty": user.specialty,
        "department": user.department,
        "is_active": user.is_active
    }
