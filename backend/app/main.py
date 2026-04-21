from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
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
        func.sum(models.HourlyProduction.output + models.HourlyProduction.b_grade + models.HourlyProduction.c_grade).label('total_output')
    )
    
    if date_filter:
        query = query.filter(models.HourlyProduction.date == date_filter)
    elif month_filter:
        # month_filter format: "YYYY-MM"
        query = query.filter(func.DATE_FORMAT(models.HourlyProduction.date, '%Y-%m') == month_filter)
    
    results = query.group_by(models.HourlyProduction.cell, models.HourlyProduction.category).all()
    
    # Pivot the data
    summary_map = {}
    for cell, category, total in results:
        if cell not in summary_map:
            summary_map[cell] = {"cell": cell, "total_all": 0}
        summary_map[cell][category] = total
        summary_map[cell]["total_all"] += total
        
    return sorted(list(summary_map.values()), key=lambda x: x['cell'])

@app.get("/hourly-dates")
def get_hourly_dates(db: Session = Depends(database.get_db)):
    dates = db.query(models.HourlyProduction.date).distinct().all()
    return [d[0] for d in dates]
