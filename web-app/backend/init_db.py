"""
Initialize the database with demo users
"""
import os
from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def init_db():
    # Ensure database directory exists
    db_dir = os.path.join(os.path.dirname(__file__), "database")
    os.makedirs(db_dir, exist_ok=True)
    
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("Checking for existing users...")

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
        print("\nDemo credentials:")
        print("-" * 50)
        for user_data in demo_users:
            print(f"\n{user_data['role'].value.upper()}:")
            print(f"  Email: {user_data['email']}")
            print(f"  Password: {user_data['password']}")
        print("-" * 50)

    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
