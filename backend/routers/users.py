"""
User authentication and profile routes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserSignup, UserLogin, UserRead, UserUpdate, Token
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/auth/signup", response_model=Token)
def signup(data: UserSignup, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=f"{data.first_name} {data.last_name}",
        email=data.email,
        hashed_password=hash_password(data.password),
        phone=data.phone,
        city=data.city,
        country=data.country,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/auth/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/users/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/users/me", response_model=UserRead)
def update_me(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/users/me")
def delete_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()
    return {"detail": "Account deleted"}


# ─── Admin Routes ────────────────────────────────────

@router.get("/admin/users", response_model=list[UserRead])
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(User).all()


@router.delete("/admin/users/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted"}


@router.get("/admin/stats")
def admin_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    from models import Trip, Activity, Stop
    from sqlalchemy import func
    from datetime import datetime, timedelta

    total_users = db.query(User).count()
    total_trips = db.query(Trip).count()
    total_activities = db.query(Activity).count()

    # Top 5 most-added cities
    top_cities = (
        db.query(Stop.city, func.count(Stop.id).label("count"))
        .group_by(Stop.city)
        .order_by(func.count(Stop.id).desc())
        .limit(5)
        .all()
    )

    # Trips created per week (last 8 weeks)
    trips_per_week = []
    for i in range(7, -1, -1):
        week_start = datetime.utcnow() - timedelta(weeks=i + 1)
        week_end = datetime.utcnow() - timedelta(weeks=i)
        count = db.query(Trip).filter(
            Trip.created_at >= week_start,
            Trip.created_at < week_end
        ).count()
        trips_per_week.append({
            "week": f"W{8 - i}",
            "count": count
        })

    return {
        "total_users": total_users,
        "total_trips": total_trips,
        "total_activities": total_activities,
        "top_cities": [{"city": c[0], "count": c[1]} for c in top_cities],
        "trips_per_week": trips_per_week,
    }


@router.patch("/admin/users/{user_id}/ban")
def toggle_ban(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_banned = not user.is_banned
    db.commit()
    return {"is_banned": user.is_banned}


# ─── Profile Photo Upload ───────────────────────────

import shutil, uuid
from fastapi import UploadFile, File
from pathlib import Path

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/users/me/photo")
def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ext = file.filename.split(".")[-1]
    filename = f"profile_{current_user.id}_{uuid.uuid4().hex}.{ext}"
    path = UPLOAD_DIR / filename
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    current_user.profile_photo = f"/uploads/{filename}"
    db.commit()
    return {"profile_photo": current_user.profile_photo}


# ─── Favourites ──────────────────────────────────────

from models import UserFavourite


@router.get("/users/me/favourites")
def get_favourites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(UserFavourite).filter(UserFavourite.user_id == current_user.id).all()


@router.post("/users/me/favourites/{city_id}")
def add_favourite(city_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fav = UserFavourite(user_id=current_user.id, city_id=city_id)
    db.add(fav)
    db.commit()
    return {"saved": True}


@router.delete("/users/me/favourites/{city_id}")
def remove_favourite(city_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(UserFavourite).filter(
        UserFavourite.user_id == current_user.id,
        UserFavourite.city_id == city_id
    ).delete()
    db.commit()
    return {"removed": True}
