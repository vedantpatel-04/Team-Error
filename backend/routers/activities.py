"""
Activity CRUD routes within a stop.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Activity, Stop, Trip, User
from schemas import ActivityCreate, ActivityRead
from auth import get_current_user

router = APIRouter(prefix="/api/stops/{stop_id}/activities", tags=["activities"])


def _verify_stop(stop_id: int, user: User, db: Session) -> Stop:
    stop = db.query(Stop).filter(Stop.id == stop_id).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    trip = db.query(Trip).filter(Trip.id == stop.trip_id, Trip.user_id == user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return stop


@router.get("", response_model=list[ActivityRead])
def list_activities(stop_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_stop(stop_id, current_user, db)
    return db.query(Activity).filter(Activity.stop_id == stop_id).all()


@router.post("", response_model=ActivityRead)
def create_activity(stop_id: int, data: ActivityCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_stop(stop_id, current_user, db)
    activity = Activity(stop_id=stop_id, **data.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.put("/{activity_id}", response_model=ActivityRead)
def update_activity(stop_id: int, activity_id: int, data: ActivityCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_stop(stop_id, current_user, db)
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.stop_id == stop_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(activity, key, value)
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/{activity_id}")
def delete_activity(stop_id: int, activity_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_stop(stop_id, current_user, db)
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.stop_id == stop_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(activity)
    db.commit()
    return {"detail": "Activity deleted"}


@router.patch("/{activity_id}/toggle")
def toggle_activity(stop_id: int, activity_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_stop(stop_id, current_user, db)
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.stop_id == stop_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    activity.is_selected = not activity.is_selected
    db.commit()
    db.refresh(activity)
    return activity
