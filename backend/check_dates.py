from app.database import SessionLocal
from app import models
from sqlalchemy import func
import datetime

db = SessionLocal()
try:
    prod_dates = db.query(models.HourlyProduction.date).distinct().all()
    visitor_dates = db.query(func.date(models.VisitorLog.visited_at)).distinct().all()
    
    print("Prod Dates:", prod_dates)
    print("Visitor Dates:", visitor_dates)
    
    all_dates = set()
    for d in prod_dates:
        all_dates.add(d[0].isoformat() if hasattr(d[0], 'isoformat') else str(d[0]))
    for d in visitor_dates:
        all_dates.add(d[0].isoformat() if hasattr(d[0], 'isoformat') else str(d[0]))
    
    print("Final Dates:", sorted(list(all_dates)))
finally:
    db.close()
