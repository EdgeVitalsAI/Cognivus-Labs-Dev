"""
Script to seed mock system logs for testing admin panel
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.system_log import SystemLog


def seed_logs():
    db: Session = SessionLocal()

    print("=" * 60)
    print("Seeding Mock System Logs")
    print("=" * 60)

    # Clear existing logs
    db.query(SystemLog).delete()
    db.commit()

    services = ["Backend API", "PostgreSQL Database", "Device Service", "MQTT Broker", "Redis Cache"]

    log_templates = {
        "info": [
            "Service started successfully",
            "Health check passed",
            "Connection pool initialized",
            "Cache cleared successfully",
            "Configuration loaded",
            "Request completed successfully",
            "Data backup completed",
        ],
        "warning": [
            "High memory usage detected",
            "Connection pool near limit",
            "Slow query detected",
            "Cache miss rate high",
            "Retry attempt {attempt}",
        ],
        "error": [
            "Connection timeout",
            "Failed to connect to service",
            "Query execution failed",
            "Authentication failed",
            "Rate limit exceeded",
        ],
        "critical": [
            "Service unavailable",
            "Database connection lost",
            "Critical error in request handler",
            "Out of memory",
        ]
    }

    logs = []

    # Generate logs for the last 24 hours
    for _ in range(200):
        service = random.choice(services)
        level = random.choices(
            ["info", "warning", "error", "critical"],
            weights=[70, 20, 8, 2]
        )[0]

        message = random.choice(log_templates[level])
        if "{attempt}" in message:
            message = message.format(attempt=random.randint(1, 3))

        log = SystemLog(
            service=service,
            level=level,
            message=message,
            details={
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": f"req_{random.randint(10000, 99999)}",
                "duration_ms": random.randint(5, 500)
            },
            timestamp=datetime.utcnow() - timedelta(minutes=random.randint(1, 1440))
        )

        logs.append(log)
        db.add(log)

    db.commit()

    print(f"\n✅ Created {len(logs)} mock system logs")
    print("\nLog Level Summary:")
    print(f"  INFO: {sum(1 for log in logs if log.level == 'info')}")
    print(f"  WARNING: {sum(1 for log in logs if log.level == 'warning')}")
    print(f"  ERROR: {sum(1 for log in logs if log.level == 'error')}")
    print(f"  CRITICAL: {sum(1 for log in logs if log.level == 'critical')}")

    print("\n" + "=" * 60)
    print("Recent Logs:")
    print("=" * 60)
    recent = sorted(logs, key=lambda x: x.timestamp, reverse=True)[:5]
    for log in recent:
        print(f"[{log.timestamp.strftime('%H:%M:%S')}] {log.level.upper()} - {log.service}: {log.message}")

    db.close()


if __name__ == "__main__":
    seed_logs()
