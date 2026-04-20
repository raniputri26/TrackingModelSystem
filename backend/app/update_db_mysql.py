import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "tracking_system")

try:
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=int(DB_PORT)
    )
    cursor = connection.cursor()

    # Check if column exists
    cursor.execute(f"SHOW COLUMNS FROM hourly_production LIKE 'note'")
    result = cursor.fetchone()

    if not result:
        cursor.execute("ALTER TABLE hourly_production ADD COLUMN note VARCHAR(500) NULL")
        connection.commit()
        print("Column 'note' added successfully to 'hourly_production' table.")
    else:
        print("Column 'note' already exists.")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'connection' in locals() and connection.open:
        connection.close()
