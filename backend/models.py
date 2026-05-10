"""
SQLAlchemy ORM models for TravelLoop.
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, Date, DateTime, Time, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    city = Column(String(255), nullable=True)
    country = Column(String(255), nullable=True)
    profile_photo = Column(String(500), nullable=True)
    language = Column(String(10), default="en")
    is_admin = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    cover_photo = Column(String(500), nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="trips")
    stops = relationship("Stop", back_populates="trip", cascade="all, delete-orphan", order_by="Stop.order_index")
    budget_items = relationship("BudgetItem", back_populates="trip", cascade="all, delete-orphan")
    checklist_items = relationship("ChecklistItem", back_populates="trip", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="trip", cascade="all, delete-orphan")
    day_plans = relationship("DayPlan", back_populates="trip", cascade="all, delete-orphan", order_by="DayPlan.plan_date")


class Stop(Base):
    __tablename__ = "stops"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    city = Column(String(255), nullable=False)
    country = Column(String(255), nullable=False)
    arrival_date = Column(Date, nullable=True)
    departure_date = Column(Date, nullable=True)
    order_index = Column(Integer, default=0)

    trip = relationship("Trip", back_populates="stops")
    activities = relationship("Activity", back_populates="stop", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="stop")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    stop_id = Column(Integer, ForeignKey("stops.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=True)
    cost = Column(Float, default=0.0)
    duration_minutes = Column(Integer, default=60)
    description = Column(Text, nullable=True)
    is_selected = Column(Boolean, default=True)

    stop = relationship("Stop", back_populates="activities")


class BudgetItem(Base):
    __tablename__ = "budget_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)  # transport, stay, activities, meals
    amount = Column(Float, default=0.0)
    note = Column(String(500), nullable=True)

    trip = relationship("Trip", back_populates="budget_items")


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="other")  # clothing, documents, electronics, other
    is_packed = Column(Boolean, default=False)

    trip = relationship("Trip", back_populates="checklist_items")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    stop_id = Column(Integer, ForeignKey("stops.id", ondelete="SET NULL"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="notes")
    stop = relationship("Stop", back_populates="notes")


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    country = Column(String(255), nullable=False)
    region = Column(String(255), nullable=True)
    cost_index = Column(Float, default=50.0)
    popularity_score = Column(Float, default=50.0)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)


class DayPlan(Base):
    __tablename__ = "day_plans"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    plan_date = Column(Date, nullable=False)
    label = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="day_plans")
    slots = relationship("DayPlanSlot", back_populates="day_plan", cascade="all, delete-orphan", order_by="DayPlanSlot.slot_order")


class DayPlanSlot(Base):
    __tablename__ = "day_plan_slots"

    id = Column(Integer, primary_key=True, index=True)
    day_plan_id = Column(Integer, ForeignKey("day_plans.id", ondelete="CASCADE"), nullable=False)
    city = Column(String(255), nullable=False)
    country = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    slot_order = Column(Integer, default=0)
    arrival_time = Column(String(10), nullable=True)  # "09:00"
    departure_time = Column(String(10), nullable=True)  # "12:30"
    travel_time_from_prev_minutes = Column(Integer, default=0)
    is_overloaded = Column(Boolean, default=False)

    day_plan = relationship("DayPlan", back_populates="slots")
    activities = relationship("DayPlanSlotActivity", back_populates="slot", cascade="all, delete-orphan")


class DayPlanSlotActivity(Base):
    __tablename__ = "day_plan_slot_activities"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("day_plan_slots.id", ondelete="CASCADE"), nullable=False)
    activity_name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=True)
    cost = Column(Float, default=0.0)
    duration_minutes = Column(Integer, default=60)
    description = Column(Text, nullable=True)

    slot = relationship("DayPlanSlot", back_populates="activities")


class UserFavourite(Base):
    __tablename__ = "user_favourites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"))
