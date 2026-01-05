"""
Script to create initial admin user
"""
import sys
import os
from getpass import getpass
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.admin import Admin


def create_default_admin():
    """Create default admin user with predefined credentials"""
    db: Session = SessionLocal()

    print("=" * 60)
    print("Creating Default Admin User")
    print("=" * 60)

    # Check if default admin exists
    existing_admin = db.query(Admin).filter(Admin.email == "admin@cognivuslabs.com").first()
    if existing_admin:
        print(f"\n✅ Default admin already exists!")
        print(f"Email: {existing_admin.email}")
        print(f"Username: {existing_admin.username}")
        db.close()
        return existing_admin

    try:
        admin = Admin(
            username="admin",
            email="admin@cognivuslabs.com",
            full_name="System Administrator",
            hashed_password=get_password_hash("password123!"),
            is_active=True,
            is_super_admin=True
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("\n" + "=" * 60)
        print("✅ Default Admin Created Successfully!")
        print("=" * 60)
        print(f"Email: admin@cognivuslabs.com")
        print(f"Password: password123!")
        print(f"Username: admin")
        print(f"Full Name: System Administrator")
        print(f"Super Admin: Yes")
        print("=" * 60)
        print("\n⚠️  IMPORTANT: Change this password after first login!")
        print("=" * 60)

        return admin

    except Exception as e:
        print(f"\n❌ Error creating admin: {str(e)}")
        db.rollback()
        return None

    finally:
        db.close()


def create_custom_admin():
    """Create custom admin user with interactive prompts"""
    db: Session = SessionLocal()

    print("=" * 60)
    print("Create Custom Admin User")
    print("=" * 60)

    # Check if any admin exists
    existing_admins = db.query(Admin).count()
    print(f"\nCurrent admin users: {existing_admins}")

    # Get admin details
    username = input("\nUsername: ").strip()

    # Check if username already exists
    existing_admin = db.query(Admin).filter(Admin.username == username).first()
    if existing_admin:
        print(f"\n❌ Admin with username '{username}' already exists!")
        db.close()
        return

    email = input("Email: ").strip()
    full_name = input("Full Name: ").strip()
    password = getpass("Password: ")
    password_confirm = getpass("Confirm Password: ")

    if password != password_confirm:
        print("\n❌ Passwords do not match!")
        db.close()
        return

    # Ask if super admin
    is_super = input("Super Admin (y/n)? ").strip().lower() == 'y'

    # Create admin
    try:
        admin = Admin(
            username=username,
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            is_active=True,
            is_super_admin=is_super
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("\n" + "=" * 60)
        print("✅ Admin user created successfully!")
        print("=" * 60)
        print(f"ID: {admin.id}")
        print(f"Username: {admin.username}")
        print(f"Email: {admin.email}")
        print(f"Full Name: {admin.full_name}")
        print(f"Super Admin: {admin.is_super_admin}")
        print(f"Created: {admin.created_at}")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error creating admin: {str(e)}")
        db.rollback()

    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--default":
        create_default_admin()
    else:
        print("Choose option:")
        print("1. Create default admin (admin@cognivuslabs.com / password123!)")
        print("2. Create custom admin")
        choice = input("\nEnter choice (1 or 2): ").strip()

        if choice == "1":
            create_default_admin()
        else:
            create_custom_admin()
