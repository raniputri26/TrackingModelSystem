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

    model_name = Column(String(50), default="603", index=True)

    # Ensure we don't have duplicate entries for a cell on the same date in the same category
    __table_args__ = (UniqueConstraint('model_name', 'category', 'cell', 'date', name='_category_cell_date_uc'),)

class HourlyProduction(Base):
    __tablename__ = "hourly_production"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), index=True)
    cell = Column(String(50), index=True)
    date = Column(Date, index=True)
    hour_range = Column(String(50)) # e.g. "07:00 - 08:00"
    output = Column(Integer, default=0)
    input_qty = Column(Integer, default=0)
    b_grade = Column(Integer, default=0)
    c_grade = Column(Integer, default=0)
    note = Column(String(500), nullable=True)
    model_name = Column(String(50), default="603", index=True)

    # Ensure no duplicates for the exact same hour block in the same cell
    __table_args__ = (UniqueConstraint('model_name', 'category', 'cell', 'date', 'hour_range', name='_hourly_uc'),)

class CellStyle(Base):
    __tablename__ = "cell_styles"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(50), default="603", index=True)
    category = Column(String(100), index=True)
    cell = Column(String(50), index=True)
    date = Column(Date, index=True)
    style_name = Column(String(200))

    __table_args__ = (UniqueConstraint('model_name', 'category', 'cell', 'date', name='_style_uc'),)

class VisitorLog(Base):
    __tablename__ = "visitor_logs"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(50), index=True)
    user_agent = Column(String(500))
    device_type = Column(String(50)) # e.g., 'Mobile', 'Desktop', 'Tablet'
    browser = Column(String(50))
    os = Column(String(50))
    visited_at = Column(DateTime, default=datetime.utcnow, index=True)

class MarketingData(Base):
    __tablename__ = "marketing_data"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    month_name = Column(String(20)) # e.g. "March"
    pd_hrs = Column(Float)
    target = Column(Integer)
    act_output = Column(Integer)
    total_cell = Column(Integer)
    gap = Column(Integer)
    act_vs_target = Column(Float) # Percentage
    remarks = Column(String(500))
    model_name = Column(String(50), default="603", index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint('model_name', 'date', name='_marketing_uc'),)
