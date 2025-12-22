from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.user import User, UserRole
from ..schemas.user import UserLogin, UserCreate
from ..core.security import verify_password, get_password_hash, create_access_token


class AuthService:
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str, role: UserRole) -> User:
        user = db.query(User).filter(
            User.email == email,
            User.role == role
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )

        return user

    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        db_user = db.query(User).filter(User.email == user_data.email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            role=user_data.role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        return db.query(User).filter(User.email == email).first()
