"""
Smart Day Planner routes — AI-powered day optimization and day plan CRUD.
"""

import os
import json
import math
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import (
    DayPlan, DayPlanSlot, DayPlanSlotActivity,
    Trip, Stop, City, User
)
from schemas import (
    DayPlanCreate, DayPlanRead,
    DayPlanSlotCreate, DayPlanSlotRead,
    DayPlanSlotActivityCreate, DayPlanSlotActivityRead,
    OptimizeDayRequest, OptimizeDayResponse
)
from auth import get_current_user

router = APIRouter(prefix="/api", tags=["smart_day"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


# ─── Haversine Helper ────────────────────────────────

def haversine_minutes(lat1, lon1, lat2, lon2, speed_kmh=80):
    """Calculate estimated travel time in minutes between two coordinates."""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance_km = R * c
    return round((distance_km / speed_kmh) * 60)


# ─── Day Plan CRUD ───────────────────────────────────

@router.get("/trips/{trip_id}/day-plans", response_model=list[DayPlanRead])
def list_day_plans(trip_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return db.query(DayPlan).filter(DayPlan.trip_id == trip_id).order_by(DayPlan.plan_date).all()


@router.post("/trips/{trip_id}/day-plans", response_model=DayPlanRead)
def create_day_plan(trip_id: int, data: DayPlanCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    # Check if plan already exists for this date
    existing = db.query(DayPlan).filter(DayPlan.trip_id == trip_id, DayPlan.plan_date == data.plan_date).first()
    if existing:
        return existing
    plan = DayPlan(trip_id=trip_id, **data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/day-plans/{plan_id}", response_model=DayPlanRead)
def get_day_plan(plan_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(DayPlan).filter(DayPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Day plan not found")
    trip = db.query(Trip).filter(Trip.id == plan.trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return plan


@router.delete("/day-plans/{plan_id}")
def delete_day_plan(plan_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(DayPlan).filter(DayPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Day plan not found")
    trip = db.query(Trip).filter(Trip.id == plan.trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(plan)
    db.commit()
    return {"detail": "Day plan deleted"}


# ─── Day Plan Slot CRUD ──────────────────────────────

@router.post("/day-plans/{plan_id}/slots", response_model=DayPlanSlotRead)
def create_slot(plan_id: int, data: DayPlanSlotCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(DayPlan).filter(DayPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Day plan not found")
    max_order = db.query(DayPlanSlot).filter(DayPlanSlot.day_plan_id == plan_id).count()
    slot = DayPlanSlot(day_plan_id=plan_id, **data.model_dump())
    slot.slot_order = max_order
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.put("/slots/{slot_id}", response_model=DayPlanSlotRead)
def update_slot(slot_id: int, data: DayPlanSlotCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    slot = db.query(DayPlanSlot).filter(DayPlanSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(slot, key, value)
    db.commit()
    db.refresh(slot)
    return slot


@router.delete("/slots/{slot_id}")
def delete_slot(slot_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    slot = db.query(DayPlanSlot).filter(DayPlanSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    db.delete(slot)
    db.commit()
    return {"detail": "Slot deleted"}


# ─── Slot Activity CRUD ──────────────────────────────

@router.post("/slots/{slot_id}/activities", response_model=DayPlanSlotActivityRead)
def create_slot_activity(slot_id: int, data: DayPlanSlotActivityCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    slot = db.query(DayPlanSlot).filter(DayPlanSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    activity = DayPlanSlotActivity(slot_id=slot_id, **data.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/slot-activities/{activity_id}")
def delete_slot_activity(activity_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = db.query(DayPlanSlotActivity).filter(DayPlanSlotActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(activity)
    db.commit()
    return {"detail": "Activity deleted"}


# ─── AI Day Optimization ─────────────────────────────

@router.post("/ai/optimize-day", response_model=OptimizeDayResponse)
def optimize_day(data: OptimizeDayRequest, current_user: User = Depends(get_current_user)):
    slots = data.slots
    if len(slots) < 2:
        return OptimizeDayResponse(
            ordered_slots=[{"city": s.city, "suggested_arrival": "09:00", "suggested_departure": "17:00", "reason": "Only one stop"} for s in slots],
            travel_times=[],
            total_hours_used=8.0,
            is_overloaded=False,
            summary=f"Just one stop planned for {data.date}.",
            warnings=[]
        )

    # Step 1: Pre-calculate all pairwise travel times
    n = len(slots)
    travel_matrix = {}
    for i in range(n):
        for j in range(n):
            if i != j:
                t = haversine_minutes(
                    slots[i].latitude, slots[i].longitude,
                    slots[j].latitude, slots[j].longitude
                )
                travel_matrix[f"{slots[i].city} -> {slots[j].city}"] = t

    if not GEMINI_API_KEY:
        # Mock optimization - sort by preferred time
        time_order = {"morning": 0, "afternoon": 1, "evening": 2, "night": 3, "any": 1}
        sorted_slots = sorted(enumerate(slots), key=lambda x: time_order.get(x[1].preferred_time, 1))

        ordered = []
        travel_times = []
        start_hour = 9
        total_minutes = 0

        for idx, (orig_idx, slot) in enumerate(sorted_slots):
            activity_dur = sum(a.get("duration_minutes", 60) for a in slot.activities) if slot.activities else 120
            arrival = f"{start_hour:02d}:00"
            dep_hour = start_hour + (activity_dur // 60)
            dep_min = activity_dur % 60
            departure = f"{dep_hour:02d}:{dep_min:02d}"

            ordered.append({
                "city": slot.city,
                "suggested_arrival": arrival,
                "suggested_departure": departure,
                "reason": f"{'Start' if idx == 0 else 'Continue'} with {slot.city} in the {'morning' if start_hour < 12 else 'afternoon' if start_hour < 17 else 'evening'}"
            })

            total_minutes += activity_dur

            if idx < len(sorted_slots) - 1:
                next_slot = sorted_slots[idx + 1][1]
                key = f"{slot.city} -> {next_slot.city}"
                tt = travel_matrix.get(key, 30)
                travel_times.append(tt)
                total_minutes += tt
                start_hour = dep_hour + (tt // 60) + (1 if tt % 60 > 30 else 0)

        total_hours = total_minutes / 60
        cities_str = " -> ".join(s.city for _, s in sorted_slots)

        return OptimizeDayResponse(
            ordered_slots=ordered,
            travel_times=travel_times,
            total_hours_used=round(total_hours, 1),
            is_overloaded=total_hours > 14,
            summary=f"Suggested route for {data.date}: {cities_str}. Total estimated time: {total_hours:.1f} hours.",
            warnings=["Day is overloaded! Consider removing a stop."] if total_hours > 14 else []
        )

    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # Build message with travel times
        slot_descriptions = []
        for i, slot in enumerate(slots):
            acts = ", ".join(a.get("name", "activity") + f" ({a.get('duration_minutes', 60)}min)" for a in slot.activities) if slot.activities else "No specific activities"
            slot_descriptions.append(
                f"  {i+1}. {slot.city}, {slot.country} (lat:{slot.latitude}, lon:{slot.longitude}). "
                f"Activities: {acts}. Preferred time: {slot.preferred_time}"
            )

        travel_desc = "\n".join(f"  {k}: {v} minutes" for k, v in travel_matrix.items())

        prompt = (
            "You are an expert travel day planner. Given a list of places to visit in a single day "
            "with their coordinates and planned activities, return the optimal visit order with suggested "
            "time slots. Respond ONLY in JSON with this structure: "
            '{"ordered_slots": [{"city": "...", "suggested_arrival": "HH:MM", "suggested_departure": "HH:MM", "reason": "..."}], '
            '"summary": "...", "warnings": ["..."]}. No extra text.\n\n'
            f"Plan a day trip for {data.date}. Trip context: {data.trip_description}\n\n"
            f"Places to visit:\n" + "\n".join(slot_descriptions) +
            f"\n\nTravel times between places:\n{travel_desc}"
        )

        response = model.generate_content(prompt)
        result_text = response.text.strip()

        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        ai_result = json.loads(result_text)

        # Calculate travel times between ordered slots
        ordered_cities = [s["city"] for s in ai_result.get("ordered_slots", [])]
        travel_times = []
        total_minutes = 0

        for i in range(len(ordered_cities) - 1):
            key = f"{ordered_cities[i]} -> {ordered_cities[i+1]}"
            tt = travel_matrix.get(key, 30)
            travel_times.append(tt)
            total_minutes += tt

        # Calculate total activity time
        for slot in slots:
            total_minutes += sum(a.get("duration_minutes", 60) for a in slot.activities) if slot.activities else 120

        total_hours = total_minutes / 60

        return OptimizeDayResponse(
            ordered_slots=ai_result.get("ordered_slots", []),
            travel_times=travel_times,
            total_hours_used=round(total_hours, 1),
            is_overloaded=total_hours > 14,
            summary=ai_result.get("summary", ""),
            warnings=ai_result.get("warnings", [])
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI optimization failed: {str(e)}")


# ─── Nearby Grouping Suggestions ─────────────────────

@router.post("/ai/suggest-nearby-grouping")
def suggest_nearby_grouping(trip_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    stops = trip.stops
    if len(stops) < 2:
        return {"suggestions": []}

    # Get city coordinates
    city_coords = {}
    for stop in stops:
        city = db.query(City).filter(City.name == stop.city).first()
        if city and city.latitude and city.longitude:
            city_coords[stop.city] = (city.latitude, city.longitude, stop.country)

    # Find pairs within 150km
    suggestions = []
    cities = list(city_coords.keys())
    for i in range(len(cities)):
        for j in range(i + 1, len(cities)):
            lat1, lon1, country1 = city_coords[cities[i]]
            lat2, lon2, country2 = city_coords[cities[j]]
            travel_min = haversine_minutes(lat1, lon1, lat2, lon2)
            distance_km = (travel_min / 60) * 80  # reverse from speed assumption

            if distance_km <= 150:
                suggestions.append({
                    "city1": cities[i],
                    "city2": cities[j],
                    "distance_km": round(distance_km, 1),
                    "travel_minutes": travel_min,
                    "message": f"{cities[i]} and {cities[j]} are only {round(distance_km, 1)}km apart — want to plan them in a single day?"
                })

    return {"suggestions": suggestions}


# ─── Apply AI Optimization ───────────────────────────

@router.post("/day-plans/{day_plan_id}/apply-optimization")
def apply_optimization(day_plan_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Apply AI optimization result back to DB."""
    for idx, item in enumerate(data.get("ordered_slots", [])):
        slot_id = item.get("slot_id")
        if slot_id:
            db.query(DayPlanSlot).filter(DayPlanSlot.id == slot_id).update({
                "arrival_time": item.get("suggested_arrival"),
                "departure_time": item.get("suggested_departure"),
                "travel_time_from_prev_minutes": item.get("travel_time_from_prev_minutes", 0),
                "is_overloaded": item.get("is_overloaded", False),
                "slot_order": idx
            })
    db.commit()
    return {"applied": True}
