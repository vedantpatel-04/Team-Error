"""
Pydantic schemas for TravelLoop API request/response validation.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime


# ─── Auth ────────────────────────────────────────────
class UserSignup(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    profile_photo: Optional[str] = None
    language: str = "en"
    is_admin: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    profile_photo: Optional[str] = None
    language: Optional[str] = None


# ─── Trips ───────────────────────────────────────────
class TripCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    cover_photo: Optional[str] = None
    is_public: bool = False


class TripUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    cover_photo: Optional[str] = None
    is_public: Optional[bool] = None


class TripRead(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    cover_photo: Optional[str] = None
    is_public: bool
    created_at: Optional[datetime] = None
    stop_count: int = 0

    class Config:
        from_attributes = True


# ─── Stops ───────────────────────────────────────────
class StopCreate(BaseModel):
    city: str
    country: str
    arrival_date: Optional[date] = None
    departure_date: Optional[date] = None
    order_index: int = 0


class StopUpdate(BaseModel):
    city: Optional[str] = None
    country: Optional[str] = None
    arrival_date: Optional[date] = None
    departure_date: Optional[date] = None
    order_index: Optional[int] = None


class StopRead(BaseModel):
    id: int
    trip_id: int
    city: str
    country: str
    arrival_date: Optional[date] = None
    departure_date: Optional[date] = None
    order_index: int
    activities: List["ActivityRead"] = []

    class Config:
        from_attributes = True


class StopReorder(BaseModel):
    stop_ids: List[int]


# ─── Activities ──────────────────────────────────────
class ActivityCreate(BaseModel):
    name: str
    type: Optional[str] = None
    cost: float = 0.0
    duration_minutes: int = 60
    description: Optional[str] = None
    is_selected: bool = True


class ActivityRead(BaseModel):
    id: int
    stop_id: int
    name: str
    type: Optional[str] = None
    cost: float
    duration_minutes: int
    description: Optional[str] = None
    is_selected: bool

    class Config:
        from_attributes = True


# ─── Budget ──────────────────────────────────────────
class BudgetItemCreate(BaseModel):
    category: str  # transport, stay, activities, meals
    amount: float
    note: Optional[str] = None


class BudgetItemRead(BaseModel):
    id: int
    trip_id: int
    category: str
    amount: float
    note: Optional[str] = None

    class Config:
        from_attributes = True


class BudgetSummary(BaseModel):
    total: float
    by_category: dict
    activity_total: float
    avg_per_day: float


# ─── Checklist ───────────────────────────────────────
class ChecklistItemCreate(BaseModel):
    name: str
    category: str = "other"


class ChecklistItemRead(BaseModel):
    id: int
    trip_id: int
    name: str
    category: str
    is_packed: bool

    class Config:
        from_attributes = True


# ─── Notes ───────────────────────────────────────────
class NoteCreate(BaseModel):
    content: str
    stop_id: Optional[int] = None


class NoteRead(BaseModel):
    id: int
    trip_id: int
    stop_id: Optional[int] = None
    content: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Cities ──────────────────────────────────────────
class CityRead(BaseModel):
    id: int
    name: str
    country: str
    region: Optional[str] = None
    cost_index: float
    popularity_score: float
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


# ─── Day Plans ───────────────────────────────────────
class DayPlanSlotActivityCreate(BaseModel):
    activity_name: str
    type: Optional[str] = None
    cost: float = 0.0
    duration_minutes: int = 60
    description: Optional[str] = None


class DayPlanSlotActivityRead(BaseModel):
    id: int
    slot_id: int
    activity_name: str
    type: Optional[str] = None
    cost: float
    duration_minutes: int
    description: Optional[str] = None

    class Config:
        from_attributes = True


class DayPlanSlotCreate(BaseModel):
    city: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    slot_order: int = 0
    arrival_time: Optional[str] = None
    departure_time: Optional[str] = None


class DayPlanSlotRead(BaseModel):
    id: int
    day_plan_id: int
    city: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    slot_order: int
    arrival_time: Optional[str] = None
    departure_time: Optional[str] = None
    travel_time_from_prev_minutes: int = 0
    is_overloaded: bool = False
    activities: List[DayPlanSlotActivityRead] = []

    class Config:
        from_attributes = True


class DayPlanCreate(BaseModel):
    plan_date: date
    label: Optional[str] = None


class DayPlanRead(BaseModel):
    id: int
    trip_id: int
    plan_date: date
    label: Optional[str] = None
    created_at: Optional[datetime] = None
    slots: List[DayPlanSlotRead] = []

    class Config:
        from_attributes = True


# ─── AI Schemas ──────────────────────────────────────
class AISuggestRequest(BaseModel):
    city: str
    country: str
    trip_description: Optional[str] = ""
    existing_activities: List[str] = []


class AISuggestedActivity(BaseModel):
    name: str
    type: str
    cost_usd: float
    duration_minutes: int
    description: str


class OptimizeDaySlot(BaseModel):
    city: str
    country: str
    latitude: float
    longitude: float
    activities: List[dict] = []
    preferred_time: str = "any"


class OptimizeDayRequest(BaseModel):
    trip_description: Optional[str] = ""
    date: str
    slots: List[OptimizeDaySlot]


class OptimizeDayResponse(BaseModel):
    ordered_slots: List[dict]
    travel_times: List[int] = []
    total_hours_used: float = 0.0
    is_overloaded: bool = False
    summary: str = ""
    warnings: List[str] = []


# ─── Admin ───────────────────────────────────────────
class AdminStats(BaseModel):
    total_users: int
    total_trips: int
    total_activities: int
    top_cities: List[dict]
    trips_per_week: List[dict]
