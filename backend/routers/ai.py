"""
AI activity suggestion routes using Google Gemini API.
"""

import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, City
from schemas import AISuggestRequest, CityRead
from auth import get_current_user

router = APIRouter(prefix="/api", tags=["ai"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


@router.post("/ai/suggest-activities")
def suggest_activities(data: AISuggestRequest, current_user: User = Depends(get_current_user)):
    if not GEMINI_API_KEY:
        # Return mock suggestions when no API key
        return [
            {"name": f"Visit {data.city} Old Town", "type": "sightseeing", "cost_usd": 0, "duration_minutes": 120, "description": f"Explore the historic old town of {data.city}"},
            {"name": f"Local Food Tour in {data.city}", "type": "food", "cost_usd": 45, "duration_minutes": 180, "description": f"Sample authentic local cuisine across {data.city}"},
            {"name": f"{data.city} Museum Pass", "type": "culture", "cost_usd": 25, "duration_minutes": 150, "description": f"Visit the top museums in {data.city} with a combo pass"},
            {"name": f"Sunset Viewpoint {data.city}", "type": "sightseeing", "cost_usd": 0, "duration_minutes": 60, "description": f"Watch the sunset from the best viewpoint in {data.city}"},
            {"name": f"Adventure Activity near {data.city}", "type": "adventure", "cost_usd": 60, "duration_minutes": 240, "description": f"Exciting outdoor adventure near {data.city}"},
        ]

    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        existing_str = ", ".join(data.existing_activities) if data.existing_activities else "None"

        prompt = (
            "You are a travel expert. Given a city and trip context, suggest 5 specific activities. "
            "Respond ONLY in JSON array format: "
            '[{"name": "...", "type": "...", "cost_usd": 0, "duration_minutes": 0, "description": "..."}]. '
            "Types must be one of: sightseeing, food, adventure, culture. No extra text.\n\n"
            f"Suggest activities for {data.city}, {data.country}. "
            f"Trip description: {data.trip_description}. "
            f"Already planned: {existing_str}"
        )

        response = model.generate_content(prompt)
        result_text = response.text.strip()

        # Parse JSON from response
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        suggestions = json.loads(result_text)
        return suggestions

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI suggestion failed: {str(e)}")


@router.get("/cities", response_model=list[CityRead])
def list_cities(
    search: str = "",
    region: str = "",
    db: Session = Depends(get_db)
):
    query = db.query(City)
    if search:
        query = query.filter(
            (City.name.ilike(f"%{search}%")) | (City.country.ilike(f"%{search}%"))
        )
    if region:
        query = query.filter(City.region == region)
    return query.order_by(City.popularity_score.desc()).all()


@router.get("/cities/popular", response_model=list[CityRead])
def popular_cities(db: Session = Depends(get_db)):
    return db.query(City).order_by(City.popularity_score.desc()).limit(6).all()
