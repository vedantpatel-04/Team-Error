"""
TravelLoop — Main FastAPI application.
"""

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import engine, Base, SessionLocal
from models import City

# Create all tables
Base.metadata.create_all(bind=engine)


def seed_cities():
    """Seed 10 cities into the database on first run."""
    db: Session = SessionLocal()
    try:
        count = db.query(City).count()
        if count == 0:
            cities = [
                City(name="Paris", country="France", region="Europe", cost_index=85, popularity_score=98,
                     description="City of lights and romance.",
                     latitude=48.8566, longitude=2.3522),
                City(name="Tokyo", country="Japan", region="Asia", cost_index=75, popularity_score=97,
                     description="A blend of tradition and ultra-modernity.",
                     latitude=35.6762, longitude=139.6503),
                City(name="New York", country="USA", region="North America", cost_index=95, popularity_score=96,
                     description="The city that never sleeps.",
                     latitude=40.7128, longitude=-74.0060),
                City(name="Rome", country="Italy", region="Europe", cost_index=70, popularity_score=94,
                     description="Eternal city of history and cuisine.",
                     latitude=41.9028, longitude=12.4964),
                City(name="Florence", country="Italy", region="Europe", cost_index=65, popularity_score=88,
                     description="Heart of the Renaissance.",
                     latitude=43.7696, longitude=11.2558),
                City(name="Siena", country="Italy", region="Europe", cost_index=55, popularity_score=75,
                     description="Medieval Tuscan gem.",
                     latitude=43.3188, longitude=11.3308),
                City(name="Barcelona", country="Spain", region="Europe", cost_index=68, popularity_score=93,
                     description="Gaudi's playground by the sea.",
                     latitude=41.3851, longitude=2.1734),
                City(name="Bangkok", country="Thailand", region="Asia", cost_index=40, popularity_score=91,
                     description="Temples, street food, and nightlife.",
                     latitude=13.7563, longitude=100.5018),
                City(name="Dubai", country="UAE", region="Middle East", cost_index=90, popularity_score=89,
                     description="Desert luxury and futuristic skylines.",
                     latitude=25.2048, longitude=55.2708),
                City(name="Cape Town", country="South Africa", region="Africa", cost_index=45, popularity_score=85,
                     description="Mountains meet the ocean.",
                     latitude=-33.9249, longitude=18.4241),
            ]
            db.add_all(cities)
            db.commit()
            print("[OK] Seeded 10 cities into the database")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app):
    """Application lifespan: seed database on startup."""
    seed_cities()
    yield


app = FastAPI(
    title="TravelLoop API",
    description="AI-powered travel planning platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from routers import users, trips, stops, activities, budget, checklist, notes, ai, smart_day

app.include_router(users.router)
app.include_router(trips.router)
app.include_router(stops.router)
app.include_router(activities.router)
app.include_router(budget.router)
app.include_router(checklist.router)
app.include_router(notes.router)
app.include_router(ai.router)
app.include_router(smart_day.router)

# Serve uploaded files
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def root():
    return {"message": "TravelLoop API is running", "docs": "/docs"}

