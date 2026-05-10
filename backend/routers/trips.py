"""
Trip CRUD routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import Trip, Stop, User
from schemas import TripCreate, TripUpdate, TripRead
from auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/trips", tags=["trips"])


def trip_to_read(trip: Trip) -> dict:
    return {
        "id": trip.id,
        "user_id": trip.user_id,
        "name": trip.name,
        "description": trip.description,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "cover_photo": trip.cover_photo,
        "is_public": trip.is_public,
        "created_at": trip.created_at,
        "stop_count": len(trip.stops) if trip.stops else 0,
    }


@router.get("", response_model=list[TripRead])
def list_trips(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import date
    query = db.query(Trip).filter(Trip.user_id == current_user.id)

    if status == "upcoming":
        query = query.filter(Trip.start_date > date.today())
    elif status == "ongoing":
        query = query.filter(Trip.start_date <= date.today(), Trip.end_date >= date.today())
    elif status == "completed":
        query = query.filter(Trip.end_date < date.today())

    trips = query.order_by(Trip.created_at.desc()).all()
    return [trip_to_read(t) for t in trips]


@router.post("", response_model=TripRead)
def create_trip(data: TripCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = Trip(user_id=current_user.id, **data.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip_to_read(trip)


@router.get("/{trip_id}", response_model=TripRead)
def get_trip(trip_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip_to_read(trip)


@router.put("/{trip_id}", response_model=TripRead)
def update_trip(trip_id: int, data: TripUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(trip, key, value)
    db.commit()
    db.refresh(trip)
    return trip_to_read(trip)


@router.delete("/{trip_id}")
def delete_trip(trip_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
    return {"detail": "Trip deleted"}


@router.get("/public/{trip_id}", response_model=TripRead)
def get_public_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.is_public == True).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found or not public")
    return trip_to_read(trip)


@router.post("/{trip_id}/copy", response_model=TripRead)
def copy_trip(trip_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    original = db.query(Trip).filter(Trip.id == trip_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Trip not found")
    if not original.is_public and original.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot copy private trip")

    from models import Activity
    new_trip = Trip(
        user_id=current_user.id,
        name=f"Copy of {original.name}",
        description=original.description,
        start_date=original.start_date,
        end_date=original.end_date,
        cover_photo=original.cover_photo,
        is_public=False,
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    # Copy stops and activities
    for stop in original.stops:
        new_stop = Stop(
            trip_id=new_trip.id,
            city=stop.city,
            country=stop.country,
            arrival_date=stop.arrival_date,
            departure_date=stop.departure_date,
            order_index=stop.order_index,
        )
        db.add(new_stop)
        db.commit()
        db.refresh(new_stop)
        for act in stop.activities:
            new_act = Activity(
                stop_id=new_stop.id,
                name=act.name,
                type=act.type,
                cost=act.cost,
                duration_minutes=act.duration_minutes,
                description=act.description,
                is_selected=act.is_selected,
            )
            db.add(new_act)

    db.commit()
    db.refresh(new_trip)
    return trip_to_read(new_trip)


@router.get("/{trip_id}/budget-summary")
def trip_budget_summary(trip_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    from models import BudgetItem, Activity
    budget_items = db.query(BudgetItem).filter(BudgetItem.trip_id == trip_id).all()

    by_category = {}
    total = 0.0
    for item in budget_items:
        by_category[item.category] = by_category.get(item.category, 0) + item.amount
        total += item.amount

    # Activities cost
    activity_total = 0.0
    for stop in trip.stops:
        for act in stop.activities:
            if act.is_selected:
                activity_total += act.cost

    days = max((trip.end_date - trip.start_date).days, 1)
    return {
        "total": total,
        "by_category": by_category,
        "activity_total": activity_total,
        "avg_per_day": round((total + activity_total) / days, 2),
    }
