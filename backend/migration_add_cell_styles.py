import os
import sys

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def create_cell_styles_table():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        try:
            # Create cell_styles table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS cell_styles (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    model_name VARCHAR(50) DEFAULT '603',
                    category VARCHAR(100),
                    cell VARCHAR(50),
                    date DATE,
                    style_name VARCHAR(200),
                    UNIQUE KEY _style_uc (model_name, category, cell, date)
                )
            """))
            print("Successfully created cell_styles table.")
            
        except Exception as e:
            print(f"Error creating table: {e}")

if __name__ == "__main__":
    create_cell_styles_table()
