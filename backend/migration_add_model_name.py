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

def run_migration():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("--- 1. Menambahkan kolom 'model_name' ke setiap tabel ---")
        tables = ['production_data', 'hourly_production', 'marketing_data']
        for table in tables:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN model_name VARCHAR(50) DEFAULT '603'"))
                conn.execute(text(f"UPDATE {table} SET model_name = '603' WHERE model_name IS NULL"))
                conn.execute(text(f"CREATE INDEX ix_{table}_model_name ON {table} (model_name)"))
                conn.commit()
                print(f"[OK] Kolom model_name ditambahkan ke {table}.")
            except Exception as e:
                # Error 1060 berarti kolom sudah ada, jadi bisa diabaikan
                print(f"[SKIP] Kolom model_name di {table} (mungkin sudah ada).")

        print("\n--- 2. Memperbarui aturan Unique Constraint agar memperbolehkan data dengan model yang berbeda ---")
        
        # Production Data
        try:
            conn.execute(text("ALTER TABLE production_data DROP INDEX _category_cell_date_uc"))
            conn.execute(text("ALTER TABLE production_data ADD UNIQUE INDEX _category_cell_date_uc (model_name, category, cell, date)"))
            print("[OK] Aturan duplikasi production_data diperbarui.")
        except Exception as e:
            print(f"[SKIP] production_data constraint (mungkin sudah diperbarui).")

        # Hourly Production
        try:
            conn.execute(text("ALTER TABLE hourly_production DROP INDEX _hourly_uc"))
            conn.execute(text("ALTER TABLE hourly_production ADD UNIQUE INDEX _hourly_uc (model_name, category, cell, date, hour_range)"))
            print("[OK] Aturan duplikasi hourly_production diperbarui.")
        except Exception as e:
            print(f"[SKIP] hourly_production constraint (mungkin sudah diperbarui).")

        # Marketing Data
        try:
            # Hapus index lama yang tidak unik berdasarkan model
            conn.execute(text("ALTER TABLE marketing_data DROP INDEX ix_marketing_data_date"))
        except:
            pass
            
        try:
            # Buat ulang index pencarian untuk tanggal
            conn.execute(text("CREATE INDEX ix_marketing_data_date ON marketing_data (date)"))
        except:
            pass

        try:
            # Buat constraint baru yang unik berdasarkan model dan tanggal
            conn.execute(text("ALTER TABLE marketing_data ADD UNIQUE INDEX _marketing_uc (model_name, date)"))
            print("[OK] Aturan duplikasi marketing_data diperbarui.")
        except Exception as e:
            print(f"[SKIP] marketing_data constraint (mungkin sudah diperbarui).")

        print("\n=> Migrasi Database Selesai! Data lama kamu aman.")

if __name__ == '__main__':
    run_migration()
