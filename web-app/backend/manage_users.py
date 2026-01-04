"""
User Management Script for Cognivus Health Monitoring System

This script allows administrators to:
- Add new users (doctors or staff)
- List all users
- Deactivate/activate users
- Update user information
"""
import sys
from getpass import getpass
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def print_menu():
    print("\n" + "=" * 60)
    print("Cognivus User Management System")
    print("=" * 60)
    print("1. Add new user")
    print("2. List all users")
    print("3. Deactivate user")
    print("4. Activate user")
    print("5. Delete user")
    print("6. Exit")
    print("=" * 60)


def add_user():
    """Add a new user to the database"""
    print("\n--- Add New User ---")

    # Get user type
    print("\nSelect user role:")
    print("1. Doctor")
    print("2. Staff")
    role_choice = input("Enter choice (1 or 2): ").strip()

    if role_choice == "1":
        role = UserRole.DOCTOR
    elif role_choice == "2":
        role = UserRole.STAFF
    else:
        print("Invalid choice!")
        return

    # Get basic information
    email = input("Email: ").strip()
    full_name = input("Full Name: ").strip()
    password = getpass("Password: ")
    password_confirm = getpass("Confirm Password: ")

    if password != password_confirm:
        print("Passwords do not match!")
        return

    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User with email {email} already exists!")
            return

        # Create user object
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            role=role,
            is_active=True
        )

        # Get role-specific information
        if role == UserRole.DOCTOR:
            specialty = input("Specialty: ").strip()
            license_number = input("License Number: ").strip()
            user.specialty = specialty
            user.license_number = license_number
        else:  # STAFF
            department = input("Department: ").strip()
            employee_id = input("Employee ID: ").strip()
            user.department = department
            user.employee_id = employee_id

        db.add(user)
        db.commit()
        print(f"\n✓ User {email} created successfully!")

    except Exception as e:
        print(f"Error creating user: {e}")
        db.rollback()
    finally:
        db.close()


def list_users():
    """List all users in the database"""
    print("\n--- All Users ---")

    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.created_at.desc()).all()

        if not users:
            print("No users found in the database.")
            return

        print(f"\nTotal users: {len(users)}\n")
        print("-" * 100)
        print(f"{'ID':<5} {'Email':<30} {'Name':<25} {'Role':<10} {'Active':<8} {'Created':<20}")
        print("-" * 100)

        for user in users:
            status = "Yes" if user.is_active else "No"
            created = user.created_at.strftime("%Y-%m-%d %H:%M")
            print(f"{user.id:<5} {user.email:<30} {user.full_name:<25} {user.role.value:<10} {status:<8} {created:<20}")

            if user.role == UserRole.DOCTOR and user.specialty:
                print(f"      Specialty: {user.specialty}, License: {user.license_number}")
            elif user.role == UserRole.STAFF and user.department:
                print(f"      Department: {user.department}, Employee ID: {user.employee_id}")

        print("-" * 100)

    except Exception as e:
        print(f"Error listing users: {e}")
    finally:
        db.close()


def deactivate_user():
    """Deactivate a user account"""
    print("\n--- Deactivate User ---")
    email = input("Enter user email to deactivate: ").strip()

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            print(f"User with email {email} not found!")
            return

        if not user.is_active:
            print(f"User {email} is already inactive!")
            return

        user.is_active = False
        db.commit()
        print(f"\n✓ User {email} deactivated successfully!")

    except Exception as e:
        print(f"Error deactivating user: {e}")
        db.rollback()
    finally:
        db.close()


def activate_user():
    """Activate a user account"""
    print("\n--- Activate User ---")
    email = input("Enter user email to activate: ").strip()

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            print(f"User with email {email} not found!")
            return

        if user.is_active:
            print(f"User {email} is already active!")
            return

        user.is_active = True
        db.commit()
        print(f"\n✓ User {email} activated successfully!")

    except Exception as e:
        print(f"Error activating user: {e}")
        db.rollback()
    finally:
        db.close()


def delete_user():
    """Delete a user from the database"""
    print("\n--- Delete User ---")
    print("WARNING: This action cannot be undone!")
    email = input("Enter user email to delete: ").strip()

    confirm = input(f"Are you sure you want to delete {email}? (yes/no): ").strip().lower()
    if confirm != "yes":
        print("Deletion cancelled.")
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            print(f"User with email {email} not found!")
            return

        db.delete(user)
        db.commit()
        print(f"\n✓ User {email} deleted successfully!")

    except Exception as e:
        print(f"Error deleting user: {e}")
        db.rollback()
    finally:
        db.close()


def main():
    """Main function to run the user management system"""
    while True:
        print_menu()
        choice = input("\nEnter your choice (1-6): ").strip()

        if choice == "1":
            add_user()
        elif choice == "2":
            list_users()
        elif choice == "3":
            deactivate_user()
        elif choice == "4":
            activate_user()
        elif choice == "5":
            delete_user()
        elif choice == "6":
            print("\nGoodbye!")
            sys.exit(0)
        else:
            print("Invalid choice! Please enter a number between 1 and 6.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nExiting...")
        sys.exit(0)
