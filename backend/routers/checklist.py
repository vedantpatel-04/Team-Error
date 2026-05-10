"""
Checklist item CRUD routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import ChecklistItem, Trip, User
from schemas import ChecklistItemCreate, ChecklistItemRead
from auth import get_current_user

router = APIRouter(prefix="/api/trips/{trip_id}/checklist", tags=["checklist"])


def _verify_trip(trip_id: int, user: User, db: Session) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.get("", response_model=list[ChecklistItemRead])
def list_checklist(trip_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    return db.query(ChecklistItem).filter(ChecklistItem.trip_id == trip_id).all()


@router.post("", response_model=ChecklistItemRead)
def create_checklist_item(trip_id: int, data: ChecklistItemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    item = ChecklistItem(trip_id=trip_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}/toggle")
def toggle_checklist_item(trip_id: int, item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id, ChecklistItem.trip_id == trip_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_packed = not item.is_packed
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_checklist_item(trip_id: int, item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id, ChecklistItem.trip_id == trip_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"detail": "Item deleted"}


@router.post("/reset")
def reset_checklist(trip_id: int, category: str = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    query = db.query(ChecklistItem).filter(ChecklistItem.trip_id == trip_id)
    if category:
        query = query.filter(ChecklistItem.category == category)
    for item in query.all():
        item.is_packed = False
    db.commit()
    return {"detail": "Checklist reset"}
