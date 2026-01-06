from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import List
from pydantic import BaseModel, EmailStr

from ...core.database import get_db
from ...core.security import get_password_hash, verify_password
from ...models.user import User, UserRole
from ...models.admin import Admin

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/sys/auth/login")


class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    specialty: str | None = None
    license_number: str | None = None
    department: str | None = None
    employee_id: str | None = None


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    is_active: bool | None = None
    specialty: str | None = None
    license_number: str | None = None
    department: str | None = None
    employee_id: str | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class AdminPasswordChangeRequest(BaseModel):
    user_id: int
    new_password: str


@router.get("/users")
async def get_all_users(
    role: str | None = None,
    is_active: bool | None = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all doctor/staff users"""

    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    users = query.order_by(desc(User.created_at)).limit(limit).all()

    return [{
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "specialty": user.specialty,
        "license_number": user.license_number,
        "department": user.department,
        "employee_id": user.employee_id,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat()
    } for user in users]


@router.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get specific user details"""

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "specialty": user.specialty,
        "license_number": user.license_number,
        "department": user.department,
        "employee_id": user.employee_id,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat()
    }


@router.post("/users")
async def create_user(user_data: UserCreateRequest, db: Session = Depends(get_db)):
    """Create new doctor or staff user"""

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Create user
    try:
        user = User(
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            full_name=user_data.full_name,
            role=user_data.role,
            is_active=True,
            specialty=user_data.specialty if user_data.role == UserRole.DOCTOR else None,
            license_number=user_data.license_number if user_data.role == UserRole.DOCTOR else None,
            department=user_data.department if user_data.role == UserRole.STAFF else None,
            employee_id=user_data.employee_id if user_data.role == UserRole.STAFF else None
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "status": "success",
            "message": f"{user_data.role.value.title()} user created successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update user details"""

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        if user_data.full_name is not None:
            user.full_name = user_data.full_name
        if user_data.is_active is not None:
            user.is_active = user_data.is_active
        if user_data.specialty is not None and user.role == UserRole.DOCTOR:
            user.specialty = user_data.specialty
        if user_data.license_number is not None and user.role == UserRole.DOCTOR:
            user.license_number = user_data.license_number
        if user_data.department is not None and user.role == UserRole.STAFF:
            user.department = user_data.department
        if user_data.employee_id is not None and user.role == UserRole.STAFF:
            user.employee_id = user_data.employee_id

        user.updated_at = datetime.utcnow()
        db.commit()

        return {"status": "success", "message": "User updated successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete user (soft delete by deactivating)"""

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        user.is_active = False
        user.updated_at = datetime.utcnow()
        db.commit()

        return {
            "status": "success",
            "message": f"User {user.full_name} deactivated successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate user: {str(e)}"
        )


@router.post("/users/{user_id}/reset-password")
async def admin_reset_password(
    user_id: int,
    password_data: AdminPasswordChangeRequest,
    db: Session = Depends(get_db)
):
    """Admin resets user password"""

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        user.hashed_password = get_password_hash(password_data.new_password)
        user.updated_at = datetime.utcnow()
        db.commit()

        return {
            "status": "success",
            "message": f"Password reset successfully for {user.full_name}"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset password: {str(e)}"
        )


@router.post("/change-password")
async def change_admin_password(
    password_data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Admin changes their own password"""
    from ...core.security import decode_access_token

    # Extract admin ID from JWT token
    payload = decode_access_token(token)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )

    admin_id = payload.get("admin_id")
    if not admin_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing admin ID")

    admin = db.query(Admin).filter(Admin.id == admin_id).first()

    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    # Verify current password
    if not verify_password(password_data.current_password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )

    try:
        admin.hashed_password = get_password_hash(password_data.new_password)
        admin.updated_at = datetime.utcnow()
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


@router.get("/statistics")
async def get_user_statistics(db: Session = Depends(get_db)):
    """Get user statistics"""

    total_users = db.query(User).count()
    total_doctors = db.query(User).filter(User.role == UserRole.DOCTOR).count()
    total_staff = db.query(User).filter(User.role == UserRole.STAFF).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    inactive_users = db.query(User).filter(User.is_active == False).count()

    return {
        "total_users": total_users,
        "total_doctors": total_doctors,
        "total_staff": total_staff,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "by_role": {
            "doctors": total_doctors,
            "staff": total_staff
        },
        "by_status": {
            "active": active_users,
            "inactive": inactive_users
        }
    }
