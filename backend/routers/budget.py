"""
Budget item CRUD routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import BudgetItem, Trip, User
from schemas import BudgetItemCreate, BudgetItemRead
from auth import get_current_user

router = APIRouter(prefix="/api/trips/{trip_id}/budget", tags=["budget"])


def _verify_trip(trip_id: int, user: User, db: Session) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.get("", response_model=list[BudgetItemRead])
def list_budget(trip_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    return db.query(BudgetItem).filter(BudgetItem.trip_id == trip_id).all()


@router.post("", response_model=BudgetItemRead)
def create_budget_item(trip_id: int, data: BudgetItemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    item = BudgetItem(trip_id=trip_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_budget_item(trip_id: int, item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    item = db.query(BudgetItem).filter(BudgetItem.id == item_id, BudgetItem.trip_id == trip_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Budget item not found")
    db.delete(item)
    db.commit()
    return {"detail": "Budget item deleted"}
