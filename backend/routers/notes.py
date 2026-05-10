"""
Trip notes / journal routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Note, Trip, User
from schemas import NoteCreate, NoteRead
from auth import get_current_user

router = APIRouter(prefix="/api/trips/{trip_id}/notes", tags=["notes"])


def _verify_trip(trip_id: int, user: User, db: Session) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.get("", response_model=list[NoteRead])
def list_notes(trip_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    return db.query(Note).filter(Note.trip_id == trip_id).order_by(Note.created_at.desc()).all()


@router.post("", response_model=NoteRead)
def create_note(trip_id: int, data: NoteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    note = Note(trip_id=trip_id, **data.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/{note_id}", response_model=NoteRead)
def update_note(trip_id: int, note_id: int, data: NoteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    note = db.query(Note).filter(Note.id == note_id, Note.trip_id == trip_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.content = data.content
    if data.stop_id is not None:
        note.stop_id = data.stop_id
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}")
def delete_note(trip_id: int, note_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_trip(trip_id, current_user, db)
    note = db.query(Note).filter(Note.id == note_id, Note.trip_id == trip_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"detail": "Note deleted"}
