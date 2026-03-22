#!/usr/bin/env python
"""Test the entire ECG data flow: feeder -> TimescaleDB -> backend -> frontend"""
import psycopg2
from datetime import datetime, timedelta

# Connect to TimescaleDB
try:
    conn = psycopg2.connect(
        dbname='cognivus_vitals_timeseries',
        user='timescale_user',
        password='timescale_secure_password_123',
        host='localhost',
        port=5433
    )
    cursor = conn.cursor()
    
    # Check how many ECG samples we have for patient 1
    cursor.execute("""
        SELECT COUNT(*) as count, 
               MIN(time) as first_sample, 
               MAX(time) as last_sample,
               COUNT(DISTINCT data_type) as data_types
        FROM vitals_timeseries 
        WHERE patient_id = 1 AND ecg_value IS NOT NULL
    """)
    
    result = cursor.fetchone()
    print(f"✓ TimescaleDB Connection successful!")
    print(f"  Total ECG samples for patient 1: {result[0]}")
    if result[0] > 0:
        print(f"  First sample: {result[1]}")
        print(f"  Last sample: {result[2]}")
        print(f"  Data types: {result[3]}")
        
        # Check data types
        cursor.execute("""
            SELECT DISTINCT data_type, COUNT(*) as count
            FROM vitals_timeseries 
            WHERE patient_id = 1
            GROUP BY data_type
        """)
        print("\n  Data types breakdown:")
        for row in cursor.fetchall():
            print(f"    - {row[0]}: {row[1]} samples")
        
        # Check recent 15-second window
        cursor.execute("""
            SELECT COUNT(*) as recent_count
            FROM vitals_timeseries 
            WHERE patient_id = 1 
            AND ecg_value IS NOT NULL
            AND time > NOW() - INTERVAL '15 seconds'
        """)
        recent = cursor.fetchone()[0]
        print(f"\n  Recent 15-second window: {recent} samples")
        if recent > 0:
            print(f"  ✓ Data is flowing! Last 15 seconds contains {recent} samples")
        else:
            print(f"  ✗ No recent data - check if feeder is still running")
    else:
        print("  ✗ No ECG data found for patient 1")
    
    cursor.close()
    conn.close()

except Exception as e:
    print(f"✗ Database error: {e}")
    print("  Make sure:")
    print("  1. TimescaleDB is running on localhost:5433")
    print("  2. Feeder is running and inserting data")
    print("  3. Patient 1 exists in the database")
