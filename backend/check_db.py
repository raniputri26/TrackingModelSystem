from app.database import SessionLocal
from app import models

db = SessionLocal()
try:
    cats = db.query(models.ProductionData.category).distinct().all()
    print(f"Categories in DB: {[c[0] for c in cats]}")
    count = db.query(models.ProductionData).count()
    print(f"Total records in DB: {count}")
    if count > 0:
        sample = db.query(models.ProductionData).first()
        print(f"Sample Record: {sample.category} | {sample.cell} | {sample.date}")
finally:
    db.close()
