from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...schemas.user import UserLogin, Token, UserResponse, RefreshTokenRequest
from ...services.auth import AuthService
from ...models.user import UserRole
from ...core.security import create_access_token, create_refresh_token, decode_refresh_token
from ...middleware.auth import get_current_user

router = APIRouter()


@router.post("/doctor/login", response_model=Token)
async def doctor_login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Doctor login endpoint - Returns access and refresh tokens
    """
    user = AuthService.authenticate_user(
        db=db,
        email=credentials.email,
        password=credentials.password,
        role=UserRole.DOCTOR
    )

    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.post("/staff/login", response_model=Token)
async def staff_login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Staff login endpoint - Returns access and refresh tokens
    """
    user = AuthService.authenticate_user(
        db=db,
        email=credentials.email,
        password=credentials.password,
        role=UserRole.STAFF
    )

    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    refresh_request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using a valid refresh token
    """
    payload = decode_refresh_token(refresh_request.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    user = AuthService.get_user_by_email(db=db, email=email)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})
    new_refresh_token = create_refresh_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.get("/verify", response_model=UserResponse)
async def verify_token(current_user = Depends(get_current_user)):
    """
    Verify if the access token is valid and return current user
    """
    return UserResponse.from_orm(current_user)
