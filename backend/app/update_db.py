import sqlite3
import os

db_path = 'app.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE hourly_production ADD COLUMN note VARCHAR(500)")
    conn.commit()
    print("Column 'note' added successfully to 'hourly_production' table.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("Column 'note' already exists.")
    else:
        print(f"Error: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
finally:
    conn.close()
