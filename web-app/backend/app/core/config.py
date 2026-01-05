from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Cognivus Health Monitoring System"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str
    REFRESH_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes for access token
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days for refresh token

    # Database - PostgreSQL
    POSTGRES_USER: str = "cognivus_user"
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "cognivus_auth"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    CORS_ORIGINS: str = ""

    @property
    def cors_origins(self) -> List[str]:
        # Use CORS_ORIGINS if set (for admin panel), otherwise use ALLOWED_ORIGINS
        origins_str = self.CORS_ORIGINS if self.CORS_ORIGINS and self.CORS_ORIGINS.strip() else self.ALLOWED_ORIGINS
        # Always include both ports for maximum compatibility
        all_origins = set(origin.strip() for origin in origins_str.split(","))
        all_origins.add("http://localhost:5173")
        all_origins.add("http://localhost:5174")
        return list(all_origins)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
