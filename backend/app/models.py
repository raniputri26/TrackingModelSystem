from sqlalchemy import Column, Integer, String, Float, Date, DateTime, UniqueConstraint
from .database import Base
from datetime import datetime

class ProductionData(Base):
    __tablename__ = "production_data"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), index=True)
    cell = Column(String(50), index=True)
    working_period = Column(String(100))
    date = Column(Date, index=True)
    std_mp = Column(Integer)
    act_mp = Column(Integer)
    gap = Column(Integer)
    output_day = Column(Float)
    output_h = Column(Float)
    day_status = Column(String(20), default="normal") # 'normal' or 'alert'
    hour_status = Column(String(20), default="normal") # 'normal' or 'alert'

    # Ensure we don't have duplicate entries for a cell on the same date in the same category
    __table_args__ = (UniqueConstraint('category', 'cell', 'date', name='_category_cell_date_uc'),)

class HourlyProduction(Base):
    __tablename__ = "hourly_production"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), index=True)
    cell = Column(String(50), index=True)
    date = Column(Date, index=True)
    hour_range = Column(String(50)) # e.g. "07:00 - 08:00"
    output = Column(Integer, default=0)
    b_grade = Column(Integer, default=0)
    c_grade = Column(Integer, default=0)
    note = Column(String(500), nullable=True)

    # Ensure no duplicates for the exact same hour block in the same cell
    __table_args__ = (UniqueConstraint('category', 'cell', 'date', 'hour_range', name='_hourly_uc'),)

class VisitorLog(Base):
    __tablename__ = "visitor_logs"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(50), index=True)
    user_agent = Column(String(500))
    device_type = Column(String(50)) # e.g., 'Mobile', 'Desktop', 'Tablet'
    browser = Column(String(50))
    os = Column(String(50))
    visited_at = Column(DateTime, default=datetime.utcnow, index=True)
