import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(os.path.join(os.path.dirname(__file__), 'app', '.env'))

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "tracking_system")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def upgrade():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        tables = ['production_data', 'hourly_production', 'marketing_data']
        for table in tables:
            try:
                print(f"Adding model_name to {table}...")
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN model_name VARCHAR(50) DEFAULT '603'"))
                conn.execute(text(f"UPDATE {table} SET model_name = '603' WHERE model_name IS NULL"))
                conn.execute(text(f"CREATE INDEX ix_{table}_model_name ON {table} (model_name)"))
                conn.commit()
                print(f"Success for {table}.")
            except Exception as e:
                print(f"Notice for {table} (already exists or error): {e}")

if __name__ == '__main__':
    upgrade()
