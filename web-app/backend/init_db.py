"""
Initialize the PostgreSQL database with demo users and admin account
"""
from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.admin import Admin
from app.core.security import get_password_hash

def init_db():
    print("Creating database tables in PostgreSQL...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Create default admin account
        print("Checking for admin account...")
        admin = db.query(Admin).filter(Admin.username == "admin").first()
        if not admin:
            admin = Admin(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                email="admin@cognivuslabs.com",
                full_name="System Administrator",
                is_super_admin=True,
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("Created default admin account: admin / admin123")
        else:
            print("Admin account already exists")

        print("\nChecking for existing users...")

        demo_users = [
            {
                "email": "doctor@cognivuslabs.com",
                "password": "doctor123",
                "full_name": "Sarah Anderson",
                "role": UserRole.DOCTOR,
                "specialty": "Cardiology",
                "license_number": "MD-2024-001"
            },
            {
                "email": "staff@cognivuslabs.com",
                "password": "staff123",
                "full_name": "Michael Chen",
                "role": UserRole.STAFF,
                "department": "Patient Care",
                "employee_id": "EMP-2024-001"
            }
        ]

        for user_data in demo_users:
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()

            if existing_user:
                print(f"User {user_data['email']} already exists, skipping...")
                continue

            hashed_password = get_password_hash(user_data["password"])

            user = User(
                email=user_data["email"],
                hashed_password=hashed_password,
                full_name=user_data["full_name"],
                role=user_data["role"],
                specialty=user_data.get("specialty"),
                license_number=user_data.get("license_number"),
                department=user_data.get("department"),
                employee_id=user_data.get("employee_id")
            )

            db.add(user)
            print(f"Created user: {user_data['email']} ({user_data['role'].value})")

        db.commit()
        print("\nDatabase initialization completed successfully!")
        print("\n" + "=" * 60)
        print("SYSTEM CREDENTIALS")
        print("=" * 60)
        print("\nADMIN PANEL (http://localhost:5174/sys/auth):")
        print("  Username: admin")
        print("  Password: admin123")
        print("\nDEMO ACCOUNTS:")
        print("-" * 60)
        for user_data in demo_users:
            print(f"\n{user_data['role'].value.upper()}:")
            print(f"  Email: {user_data['email']}")
            print(f"  Password: {user_data['password']}")
        print("=" * 60)

    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
