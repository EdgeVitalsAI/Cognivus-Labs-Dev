"""
Quick verification script to check backend setup
Run this to verify everything is configured correctly
"""
import sys
from sqlalchemy import text
from app.core.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.core.config import settings

def check_database_connection():
    """Check if database connection works"""
    print("\n" + "=" * 60)
    print("1. Checking Database Connection...")
    print("=" * 60)
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        print("✓ Database connection: OK")
        print(f"  Connection string: {settings.database_url.replace(settings.POSTGRES_PASSWORD, '****')}")
        return True
    except Exception as e:
        print(f"✗ Database connection: FAILED")
        print(f"  Error: {e}")
        return False

def check_users():
    """Check if demo users exist"""
    print("\n" + "=" * 60)
    print("2. Checking Demo Users...")
    print("=" * 60)
    try:
        db = SessionLocal()

        # Check doctor
        doctor = db.query(User).filter(
            User.email == "doctor@cognivuslabs.com",
            User.role == UserRole.DOCTOR
        ).first()

        if doctor:
            print("✓ Doctor user exists")
            print(f"  Email: {doctor.email}")
            print(f"  Name: {doctor.full_name}")
            print(f"  Active: {doctor.is_active}")
        else:
            print("✗ Doctor user: MISSING")

        # Check staff
        staff = db.query(User).filter(
            User.email == "staff@cognivuslabs.com",
            User.role == UserRole.STAFF
        ).first()

        if staff:
            print("✓ Staff user exists")
            print(f"  Email: {staff.email}")
            print(f"  Name: {staff.full_name}")
            print(f"  Active: {staff.is_active}")
        else:
            print("✗ Staff user: MISSING")

        db.close()

        return doctor is not None and staff is not None
    except Exception as e:
        print(f"✗ Error checking users: {e}")
        return False

def check_configuration():
    """Check configuration settings"""
    print("\n" + "=" * 60)
    print("3. Checking Configuration...")
    print("=" * 60)

    issues = []

    # Check secrets
    if settings.SECRET_KEY == "your-secret-key-change-this-in-production-make-it-very-long-and-random":
        print("⚠ WARNING: Using default SECRET_KEY (OK for development)")
    else:
        print("✓ Custom SECRET_KEY configured")

    if settings.REFRESH_SECRET_KEY == "your-refresh-secret-key-change-in-production-min-32-chars-long":
        print("⚠ WARNING: Using default REFRESH_SECRET_KEY (OK for development)")
    else:
        print("✓ Custom REFRESH_SECRET_KEY configured")

    # Check token expiration
    print(f"✓ Access token expiration: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
    print(f"✓ Refresh token expiration: {settings.REFRESH_TOKEN_EXPIRE_DAYS} days")

    # Check CORS
    print(f"✓ CORS origins: {settings.cors_origins}")

    # Check PostgreSQL settings
    print(f"✓ PostgreSQL host: {settings.POSTGRES_HOST}")
    print(f"✓ PostgreSQL database: {settings.POSTGRES_DB}")
    print(f"✓ PostgreSQL user: {settings.POSTGRES_USER}")

    return True

def test_authentication():
    """Test if authentication works"""
    print("\n" + "=" * 60)
    print("4. Testing Authentication...")
    print("=" * 60)

    from app.core.security import verify_password, get_password_hash

    try:
        # Test password hashing
        test_password = "test123"
        hashed = get_password_hash(test_password)

        if verify_password(test_password, hashed):
            print("✓ Password hashing: OK")
        else:
            print("✗ Password hashing: FAILED")
            return False

        # Test JWT token creation
        from app.core.security import create_access_token, create_refresh_token, decode_access_token, decode_refresh_token

        test_data = {"sub": "test@example.com", "role": "doctor"}
        access_token = create_access_token(test_data)
        refresh_token = create_refresh_token({"sub": "test@example.com"})

        # Verify tokens can be decoded
        access_payload = decode_access_token(access_token)
        refresh_payload = decode_refresh_token(refresh_token)

        if access_payload and refresh_payload:
            print("✓ JWT token creation/verification: OK")
        else:
            print("✗ JWT token creation/verification: FAILED")
            return False

        return True
    except Exception as e:
        print(f"✗ Authentication test failed: {e}")
        return False

def main():
    """Run all checks"""
    print("\n" + "=" * 70)
    print(" " * 15 + "COGNIVUS BACKEND VERIFICATION")
    print("=" * 70)

    results = {
        "Database Connection": check_database_connection(),
        "Demo Users": check_users(),
        "Configuration": check_configuration(),
        "Authentication": test_authentication()
    }

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)

    all_passed = True
    for check, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{check:.<50} {status}")
        if not passed:
            all_passed = False

    print("=" * 70)

    if all_passed:
        print("\n✓ All checks passed! Backend is ready.")
        print("\nDemo Credentials:")
        print("-" * 70)
        print("Doctor Login:")
        print("  Email: doctor@cognivuslabs.com")
        print("  Password: doctor123")
        print("\nStaff Login:")
        print("  Email: staff@cognivuslabs.com")
        print("  Password: staff123")
        print("-" * 70)
        sys.exit(0)
    else:
        print("\n✗ Some checks failed. Please review the errors above.")
        print("\nTroubleshooting:")
        print("1. Make sure PostgreSQL is running: docker-compose ps")
        print("2. Initialize database: docker-compose exec backend python init_db.py")
        print("3. Check logs: docker-compose logs backend")
        print("4. Verify .env configuration")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nVerification cancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
