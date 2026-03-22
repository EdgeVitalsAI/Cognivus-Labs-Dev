"""
Script to seed mock devices for testing admin panel
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.device import Device, DeviceLog, DeviceStatus


def seed_devices():
    db: Session = SessionLocal()

    print("=" * 60)
    print("Seeding Mock Devices")
    print("=" * 60)

    # Clear existing devices
    db.query(DeviceLog).delete()
    db.query(Device).delete()
    db.commit()

    # Sample patient names and rooms
    patients = [
        ("Sarah Johnson", "302A"),
        ("Michael Chen", "215B"),
        ("Emma Davis", "410C"),
        ("James Wilson", "105A"),
        ("Maria Garcia", "308B"),
        ("Robert Brown", "212C"),
        ("Lisa Anderson", "401A"),
        ("David Martinez", "118B"),
    ]

    devices = []

    for i, (patient_name, room) in enumerate(patients, 1):
        status = random.choice([
            DeviceStatus.ONLINE,
            DeviceStatus.ONLINE,
            DeviceStatus.ONLINE,  # More likely to be online
            DeviceStatus.OFFLINE,
            DeviceStatus.MAINTENANCE
        ])

        device = Device(
            device_id=f"CG-{1000 + i:04d}",
            device_name=f"Tracker #{1000 + i}",
            device_type="wearable_tracker",
            status=status,
            battery_level=random.randint(20, 100) if status == DeviceStatus.ONLINE else None,
            firmware_version=f"v{random.randint(1, 3)}.{random.randint(0, 9)}.{random.randint(0, 20)}",
            last_ping=datetime.utcnow() - timedelta(seconds=random.randint(1, 300)) if status == DeviceStatus.ONLINE else None,
            patient_id=f"P{i:04d}",
            patient_name=patient_name,
            assigned_room=room,
            ip_address=f"192.168.1.{100 + i}" if status == DeviceStatus.ONLINE else None,
            mac_address=f"00:1B:44:11:3A:{i:02X}",
            spo2=random.randint(92, 100) if status == DeviceStatus.ONLINE else None,
            heart_rate=random.randint(60, 100) if status == DeviceStatus.ONLINE else None,
            blood_pressure_sys=random.randint(110, 140) if status == DeviceStatus.ONLINE else None,
            blood_pressure_dia=random.randint(70, 90) if status == DeviceStatus.ONLINE else None,
            temperature=round(random.uniform(97.0, 99.5), 1) if status == DeviceStatus.ONLINE else None,
            location=f"Ward {chr(65 + (i % 4))}",
            activated_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            created_at=datetime.utcnow() - timedelta(days=random.randint(30, 90)),
        )

        devices.append(device)
        db.add(device)

        # Add some logs for each device
        log_messages = [
            ("info", "Device initialized successfully"),
            ("info", "Connection established"),
            ("debug", "Sensor calibration complete"),
            ("info", "Data transmission successful"),
            ("warning", "Battery level below 30%"),
            ("debug", "Heartbeat signal received"),
        ]

        for _ in range(random.randint(3, 8)):
            log_type, message = random.choice(log_messages)
            log = DeviceLog(
                device_id=device.device_id,
                log_type=log_type,
                message=message,
                timestamp=datetime.utcnow() - timedelta(minutes=random.randint(1, 60))
            )
            db.add(log)

    db.commit()

    print(f"\n✅ Created {len(devices)} mock devices")
    print("\nDevice Summary:")
    print(f"  Online: {sum(1 for d in devices if d.status == DeviceStatus.ONLINE)}")
    print(f"  Offline: {sum(1 for d in devices if d.status == DeviceStatus.OFFLINE)}")
    print(f"  Maintenance: {sum(1 for d in devices if d.status == DeviceStatus.MAINTENANCE)}")

    print("\n" + "=" * 60)
    print("Sample Devices:")
    print("=" * 60)
    for device in devices[:3]:
        print(f"ID: {device.device_id}")
        print(f"  Patient: {device.patient_name} (Room {device.assigned_room})")
        print(f"  Status: {device.status}")
        print(f"  Battery: {device.battery_level}%")
        if device.status == DeviceStatus.ONLINE:
            print(f"  Vitals: HR={device.heart_rate} SpO2={device.spo2}% Temp={device.temperature}°F")
        print()

    db.close()


if __name__ == "__main__":
    seed_devices()
