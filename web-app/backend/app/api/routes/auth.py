from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...schemas.user import UserLogin, Token, UserResponse
from ...services.auth import AuthService
from ...models.user import UserRole
from ...core.security import create_access_token

router = APIRouter()


@router.post("/doctor/login", response_model=Token)
async def doctor_login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Doctor login endpoint
    """
    user = AuthService.authenticate_user(
        db=db,
        email=credentials.email,
        password=credentials.password,
        role=UserRole.DOCTOR
    )

    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.post("/staff/login", response_model=Token)
async def staff_login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Staff login endpoint
    """
    user = AuthService.authenticate_user(
        db=db,
        email=credentials.email,
        password=credentials.password,
        role=UserRole.STAFF
    )

    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.get("/verify")
async def verify_token(db: Session = Depends(get_db)):
    """
    Verify if the token is valid
    """
    return {"status": "valid"}
