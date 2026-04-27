from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
import shutil
import os
from . import models, database, excel_processor
from pydantic import BaseModel
from datetime import date
from typing import Optional

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Tracking Model API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Tracking Model API is running"}

@app.post("/list-sheets")
async def list_sheets(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xls', '.xlsm', '.xltx', '.xltm')):
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Gunakan file Excel (.xlsx / .xls).")

    # Save temporarily to list sheets
    temp_path = f"temp_list_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        sheets = excel_processor.get_sheet_names(temp_path)
        return {"sheets": sheets}
    except Exception as e:
        print(f"Error listing sheets: {e}")
        raise HTTPException(status_code=400, detail=f"Gagal membaca sheet: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/upload")
async def upload_excel(file: UploadFile = File(...), sheet_name: str = "Summary", db: Session = Depends(database.get_db)):
    if not file.filename.endswith(('.xlsx', '.xls', '.xlsm', '.xltx', '.xltm')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")
    
    # Save temporary file
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        count = excel_processor.parse_tracking_excel(temp_path, db, sheet_name=sheet_name)
        return {"message": "Success", "records_processed": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/data")
def get_data(category: str = None, db: Session = Depends(database.get_db)):
    query = db.query(models.ProductionData)
    if category:
        query = query.filter(models.ProductionData.category == category)
    
    results = query.order_by(models.ProductionData.date.asc()).all()
    return results

@app.get("/categories")
def get_categories(db: Session = Depends(database.get_db)):
    cats = db.query(models.ProductionData.category).distinct().all()
    return [c[0] for c in cats]

# --- HOURLY INPUT ENDPOINTS ---

class HourlyInputModel(BaseModel):
    category: str
    cell: str
    date: date
    hour_range: str
    output: int
    b_grade: int
    c_grade: int
    note: Optional[str] = None

@app.get("/hourly-logs")
def get_hourly_logs(category: Optional[str] = None, cell: Optional[str] = None, date_filter: Optional[date] = None, db: Session = Depends(database.get_db)):
    query = db.query(models.HourlyProduction)
    if category and category != 'all':
        query = query.filter(models.HourlyProduction.category == category)
    if cell and cell != 'all':
        query = query.filter(models.HourlyProduction.cell == cell)
    if date_filter:
        query = query.filter(models.HourlyProduction.date == date_filter)
        
    return query.order_by(models.HourlyProduction.date.desc(), models.HourlyProduction.hour_range.asc()).all()

@app.post("/hourly-logs")
def create_hourly_log(log: HourlyInputModel, db: Session = Depends(database.get_db)):
    # Check if exists (upsert logic)
    existing = db.query(models.HourlyProduction).filter(
        models.HourlyProduction.category == log.category,
        models.HourlyProduction.cell == log.cell,
        models.HourlyProduction.date == log.date,
        models.HourlyProduction.hour_range == log.hour_range
    ).first()

    if existing:
        existing.output = log.output
        existing.b_grade = log.b_grade
        existing.c_grade = log.c_grade
        existing.note = log.note
        db.commit()
        return {"message": "Updated existing log", "id": existing.id}
    else:
        new_log = models.HourlyProduction(
            category=log.category,
            cell=log.cell,
            date=log.date,
            hour_range=log.hour_range,
            output=log.output,
            b_grade=log.b_grade,
            c_grade=log.c_grade,
            note=log.note
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        return {"message": "Created new log", "id": new_log.id}

@app.put("/hourly-logs/{log_id}")
def update_hourly_log(log_id: int, log: HourlyInputModel, db: Session = Depends(database.get_db)):
    record = db.query(models.HourlyProduction).filter(models.HourlyProduction.id == log_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Log not found")
    
    record.category = log.category
    record.cell = log.cell
    record.date = log.date
    record.hour_range = log.hour_range
    record.output = log.output
    record.b_grade = log.b_grade
    record.c_grade = log.c_grade
    record.note = log.note
    
    db.commit()
    return {"message": "Updated successfully"}

@app.delete("/hourly-logs/{log_id}")
def delete_hourly_log(log_id: int, db: Session = Depends(database.get_db)):
    record = db.query(models.HourlyProduction).filter(models.HourlyProduction.id == log_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(record)
    db.commit()
    return {"message": "Deleted successfully"}

@app.get("/hourly-summary")
def get_hourly_summary(date_filter: Optional[date] = None, month_filter: Optional[str] = None, db: Session = Depends(database.get_db)):
    # Query to sum output + b_grade + c_grade grouped by cell and category
    query = db.query(
        models.HourlyProduction.cell,
        models.HourlyProduction.category,
        func.sum(models.HourlyProduction.output + models.HourlyProduction.b_grade + models.HourlyProduction.c_grade).label('total_output'),
        func.sum(models.HourlyProduction.b_grade).label('total_b_grade'),
        func.sum(models.HourlyProduction.c_grade).label('total_c_grade')
    )
    
    if date_filter:
        query = query.filter(models.HourlyProduction.date == date_filter)
    elif month_filter:
        # month_filter format: "YYYY-MM"
        query = query.filter(func.DATE_FORMAT(models.HourlyProduction.date, '%Y-%m') == month_filter)
    
    results = query.group_by(models.HourlyProduction.cell, models.HourlyProduction.category).all()
    
    # Pivot the data
    summary_map = {}
    for cell, category, total, b_grade, c_grade in results:
        if cell not in summary_map:
            summary_map[cell] = {"cell": cell, "total_all": 0, "total_b_grade": 0, "total_c_grade": 0}
        summary_map[cell][category] = total
        summary_map[cell]["total_all"] += total
        summary_map[cell]["total_b_grade"] += (b_grade or 0)
        summary_map[cell]["total_c_grade"] += (c_grade or 0)
        
    return sorted(list(summary_map.values()), key=lambda x: x['cell'])

@app.get("/hourly-timeline")
def get_hourly_timeline(category: Optional[str] = None, date_filter: Optional[date] = None, month_filter: Optional[str] = None, db: Session = Depends(database.get_db)):
    # Fetch records to allow access to individual IDs and details
    query = db.query(models.HourlyProduction)
    
    if category and category != 'ALL CATEGORY':
        query = query.filter(models.HourlyProduction.category == category)
    
    if date_filter:
        query = query.filter(models.HourlyProduction.date == date_filter)
    elif month_filter:
        query = query.filter(func.DATE_FORMAT(models.HourlyProduction.date, '%Y-%m') == month_filter)
    
    results = query.all()
    
    # Pivot the data in Python to preserve IDs and handle multiple logs if any
    timeline_map = {}
    for log in results:
        cell = log.cell
        hour = log.hour_range
        
        if cell not in timeline_map:
            timeline_map[cell] = {"cell": cell, "total_all": 0}
        
        # Store as an object with details
        if hour not in timeline_map[cell]:
            timeline_map[cell][hour] = {
                "total": 0,
                "logs": []
            }
        
        total_val = (log.output or 0) + (log.b_grade or 0) + (log.c_grade or 0)
        timeline_map[cell][hour]["total"] += total_val
        timeline_map[cell][hour]["logs"].append({
            "id": log.id,
            "category": log.category,
            "cell": log.cell,
            "date": log.date.isoformat() if hasattr(log.date, 'isoformat') else str(log.date),
            "hour_range": log.hour_range,
            "output": log.output,
            "b_grade": log.b_grade,
            "c_grade": log.c_grade,
            "note": log.note
        })
        timeline_map[cell]["total_all"] += total_val
        
    return sorted(list(timeline_map.values()), key=lambda x: x['cell'])

@app.get("/hourly-dates")
def get_hourly_dates(db: Session = Depends(database.get_db)):
    prod_dates = db.query(models.HourlyProduction.date).distinct().all()
    visitor_dates = db.query(func.date(models.VisitorLog.visited_at)).distinct().all()
    
    all_dates = set()
    for d in prod_dates:
        all_dates.add(d[0].isoformat() if hasattr(d[0], 'isoformat') else str(d[0]))
    for d in visitor_dates:
        all_dates.add(d[0].isoformat() if hasattr(d[0], 'isoformat') else str(d[0]))
        
    return sorted(list(all_dates))

# --- VISITOR ANALYTICS ENDPOINTS ---

def parse_user_agent(ua_string: str):
    ua_string = ua_string.lower() if ua_string else ""
    
    device_type = "Desktop"
    if any(m in ua_string for m in ["mobi", "android", "iphone", "ipad", "windows phone"]):
        device_type = "Mobile"
        if "ipad" in ua_string or "tablet" in ua_string:
            device_type = "Tablet"
            
    os = "Unknown OS"
    if "windows" in ua_string: os = "Windows"
    elif "mac os x" in ua_string: os = "macOS"
    elif "android" in ua_string: os = "Android"
    elif "iphone os" in ua_string or "ipad" in ua_string: os = "iOS"
    elif "linux" in ua_string: os = "Linux"

    browser = "Unknown Browser"
    if "edg/" in ua_string: browser = "Edge"
    elif "chrome/" in ua_string: browser = "Chrome"
    elif "safari/" in ua_string and "chrome" not in ua_string: browser = "Safari"
    elif "firefox/" in ua_string: browser = "Firefox"
    elif "opera/" in ua_string or "opr/" in ua_string: browser = "Opera"
    
    return device_type, os, browser

@app.post("/track-visit")
async def track_visit(request: Request, db: Session = Depends(database.get_db)):
    # Get IP Address (handling proxies if any)
    ip_address = request.headers.get("X-Forwarded-For")
    if ip_address:
        ip_address = ip_address.split(",")[0].strip()
    else:
        ip_address = request.headers.get("X-Real-IP")
        if not ip_address:
            ip_address = request.client.host if request.client else "unknown"

    user_agent = request.headers.get("User-Agent", "")
    device_type, os, browser = parse_user_agent(user_agent)

    from datetime import datetime
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    log = models.VisitorLog(
        ip_address=ip_address,
        user_agent=user_agent[:500],
        device_type=device_type,
        os=os,
        browser=browser
    )
    db.add(log)
    db.commit()
    return {"status": "tracked"}

@app.get("/visitors")
def get_visitors(
    filter_mode: str = 'all', 
    filter_value: str = '',
    db: Session = Depends(database.get_db)
):
    query = db.query(models.VisitorLog)
    
    if filter_mode == 'day' and filter_value:
        try:
            query = query.filter(func.date(models.VisitorLog.visited_at) == filter_value)
        except: pass
    elif filter_mode == 'month' and filter_value:
        try:
            year, month = map(int, filter_value.split('-'))
            query = query.filter(
                extract('year', models.VisitorLog.visited_at) == year,
                extract('month', models.VisitorLog.visited_at) == month
            )
        except: pass
    elif filter_mode == 'week' and filter_value:
        try:
            year, week = map(int, filter_value.split('-W'))
            import datetime as dt
            # ISO week calculation
            start_date = dt.datetime.strptime(f'{year}-W{week}-1', "%G-W%V-%u").date()
            end_date = start_date + dt.timedelta(days=6)
            query = query.filter(func.date(models.VisitorLog.visited_at).between(start_date, end_date))
        except: pass

    logs = query.order_by(models.VisitorLog.visited_at.desc()).all()
    
    total_views = len(logs)
    unique_ips = len(set([log.ip_address for log in logs]))
    
    # Aggregate devices
    devices = {}
    for log in logs:
        key = f"{log.device_type} - {log.os}"
        if key not in devices:
            devices[key] = 0
        devices[key] += 1
        
    devices_arr = [{"name": k, "value": v} for k, v in devices.items()]
    
    # Trend
    from collections import Counter
    days = Counter([log.visited_at.strftime('%Y-%m-%d') for log in logs])
    trend = [{"date": k, "visits": v} for k, v in sorted(days.items())]

    return {
        "total_views": total_views,
        "unique_visitors": unique_ips,
        "devices": sorted(devices_arr, key=lambda x: x['value'], reverse=True),
        "trend": trend,
        "recent_logs": [
            {
                "ip": log.ip_address,
                "device": log.device_type,
                "os": log.os,
                "browser": log.browser,
                "time": log.visited_at.strftime('%Y-%m-%d %H:%M:%S')
            } for log in logs[:10]
        ]
    }
