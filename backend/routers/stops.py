"""
Stop CRUD routes within a trip.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Stop, Trip, User
from schemas import StopCreate, StopUpdate, StopRead, StopReorder
from auth import get_current_user

router = APIRouter(prefix="/api/trips/{trip_id}/stops", tags=["stops"])


def _verify_trip(trip_id: int, user: User, db: Session) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.get("", response_model=list[StopRead])
def list_stops(trip_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    return db.query(Stop).filter(Stop.trip_id == trip_id).order_by(Stop.order_index).all()


@router.post("", response_model=StopRead)
def create_stop(trip_id: int, data: StopCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    # Auto-set order_index
    max_order = db.query(Stop).filter(Stop.trip_id == trip_id).count()
    stop = Stop(trip_id=trip_id, **data.model_dump())
    stop.order_index = max_order
    db.add(stop)
    db.commit()
    db.refresh(stop)
    return stop


@router.put("/{stop_id}", response_model=StopRead)
def update_stop(trip_id: int, stop_id: int, data: StopUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    stop = db.query(Stop).filter(Stop.id == stop_id, Stop.trip_id == trip_id).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(stop, key, value)
    db.commit()
    db.refresh(stop)
    return stop


@router.delete("/{stop_id}")
def delete_stop(trip_id: int, stop_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    stop = db.query(Stop).filter(Stop.id == stop_id, Stop.trip_id == trip_id).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    db.delete(stop)
    db.commit()
    return {"detail": "Stop deleted"}


@router.post("/reorder")
def reorder_stops(trip_id: int, data: StopReorder, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    for idx, stop_id in enumerate(data.stop_ids):
        stop = db.query(Stop).filter(Stop.id == stop_id, Stop.trip_id == trip_id).first()
        if stop:
            stop.order_index = idx
    db.commit()
    return {"detail": "Stops reordered"}
