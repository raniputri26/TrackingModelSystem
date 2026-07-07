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

def upgrade_constraints():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        try:
            print("Updating production_data constraints...")
            conn.execute(text("ALTER TABLE production_data DROP INDEX _category_cell_date_uc"))
            conn.execute(text("ALTER TABLE production_data ADD UNIQUE INDEX _category_cell_date_uc (model_name, category, cell, date)"))
            print("production_data success.")
        except Exception as e:
            print(f"Error on production_data: {e}")

        try:
            print("Updating hourly_production constraints...")
            conn.execute(text("ALTER TABLE hourly_production DROP INDEX _hourly_uc"))
            conn.execute(text("ALTER TABLE hourly_production ADD UNIQUE INDEX _hourly_uc (model_name, category, cell, date, hour_range)"))
            print("hourly_production success.")
        except Exception as e:
            print(f"Error on hourly_production: {e}")

        try:
            print("Updating marketing_data constraints...")
            # the previous one might be an index named ix_marketing_data_date
            conn.execute(text("ALTER TABLE marketing_data DROP INDEX ix_marketing_data_date"))
            # Recreate regular index on date
            conn.execute(text("CREATE INDEX ix_marketing_data_date ON marketing_data (date)"))
            # Create the unique constraint on (model_name, date)
            conn.execute(text("ALTER TABLE marketing_data ADD UNIQUE INDEX _marketing_uc (model_name, date)"))
            print("marketing_data success.")
        except Exception as e:
            print(f"Error on marketing_data: {e}")

if __name__ == '__main__':
    upgrade_constraints()
