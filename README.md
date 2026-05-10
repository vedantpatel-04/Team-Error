# ✈️ TravelLoop — AI-Powered Travel Planning Platform

> Smart Itinerary Building · Day Optimization · Budget Tracking · Collaborative Trip Planning

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg)](https://vitejs.dev)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4.svg)](https://ai.google.dev)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg)](https://sqlite.org)

---

## 📋 Overview

TravelLoop is a full-stack AI-powered travel planning platform that helps travelers build beautiful, optimized itineraries end-to-end. It combines intelligent activity suggestions, smart day scheduling, real-time budget tracking, and collaborative trip sharing into one seamless experience.

- 🗺️ **Itinerary Builder** — Drag-and-drop multi-city trip builder with stop management
- 🧠 **AI Activity Suggestions** — Gemini 2.0 Flash recommends activities per city based on your trip context
- 📅 **Smart Day Planner** — AI-powered day optimization with travel time calculations (Haversine), overload detection, and slot scheduling
- 💰 **Budget Breakdown** — Per-category expense tracking with Recharts visualizations and daily threshold alerts
- 🎒 **Packing Checklist** — Categorized checklist with progress tracking and bulk reset
- 📝 **Trip Notes** — Per-trip and per-stop journaling with timestamps
- 🌍 **City Explorer** — Searchable, filterable database of 10+ seeded world destinations
- 🔗 **Trip Sharing** — Public shareable links with one-click copy to your own account
- 👤 **User Profile** — Photo upload, language settings, favourite cities, account deletion
- ⚙️ **Admin Dashboard** — User management, ban toggle, platform analytics with Recharts charts

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              React Frontend (Vite + Tailwind)         │
│  Dashboard · Itinerary · Budget · Planner · Admin    │
└──────────────────────┬──────────────────────────────┘
                       │ Axios + JWT Bearer
                       ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                 │
│                                                       │
│  /api/auth     → Signup / Login (bcrypt + JWT)       │
│  /api/trips    → Full trip CRUD + copy + share       │
│  /api/trips/:id/stops      → Stop management         │
│  /api/stops/:id/activities → Activity CRUD           │
│  /api/trips/:id/budget     → Budget items            │
│  /api/trips/:id/checklist  → Packing checklist       │
│  /api/trips/:id/notes      → Trip journaling         │
│  /api/trips/:id/day-plans  → Smart day plans         │
│  /api/ai/suggest-activities → Gemini suggestions     │
│  /api/ai/optimize-day       → Gemini day optimizer   │
│  /api/cities               → City search & popular   │
│  /api/admin/*              → Admin stats & users     │
└──────────────────────┬──────────────────────────────┘
                       │ SQLAlchemy ORM
                       ▼
┌─────────────────────────────────────────────────────┐
│              SQLite Database (traveloop.db)           │
│  users · trips · stops · activities · budget_items   │
│  checklist_items · notes · cities · day_plans        │
│  day_plan_slots · day_plan_slot_activities           │
│  user_favourites                                     │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Google Gemini 2.0 Flash API             │
│  • Activity suggestions (JSON array output)          │
│  • Day optimization (ordered slots + warnings)       │
│  • Nearby city grouping suggestions                  │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+ (tested on 3.14)
- Node.js 18+
- A Google Gemini API key (optional — app works without it using mock data)

---

### 1. Clone the Repository

```bash
git clone https://github.com/vedantpatel-04/Team-Error.git
cd Team-Error
```

---

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```env
SECRET_KEY=your-super-secret-key-change-this
GEMINI_API_KEY=your-gemini-api-key-here
```

> **Note:** If `GEMINI_API_KEY` is left empty, the AI features return realistic mock data automatically. The app is fully functional without a key.

Start the backend:

```bash
python -m uvicorn main:app --reload --port 8000
```

The API will be live at [http://localhost:8000](http://localhost:8000)  
Interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs)

On first start, the database is created automatically and seeded with **10 world cities** (Paris, Tokyo, New York, Rome, Florence, Siena, Barcelona, Bangkok, Dubai, Cape Town).

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will open at [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
TravelLoop/
├── backend/
│   ├── main.py                  # FastAPI app entry point, CORS, router registration, DB seed
│   ├── database.py              # SQLAlchemy engine, session, Base
│   ├── models.py                # All ORM models (User, Trip, Stop, Activity, etc.)
│   ├── schemas.py               # Pydantic request/response schemas
│   ├── auth.py                  # JWT creation, bcrypt hashing, get_current_user
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (SECRET_KEY, GEMINI_API_KEY)
│   └── routers/
│       ├── users.py             # Auth, profile, photo upload, favourites, admin
│       ├── trips.py             # Trip CRUD, copy, share, budget summary
│       ├── stops.py             # Stop CRUD, reorder
│       ├── activities.py        # Activity CRUD, toggle selected
│       ├── budget.py            # Budget item CRUD
│       ├── checklist.py         # Packing checklist CRUD, toggle, reset
│       ├── notes.py             # Trip notes CRUD
│       ├── ai.py                # Gemini activity suggestions, city search
│       └── smart_day.py         # Day plans, slots, AI optimize, apply optimization
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx              # Router, protected routes, layout
│       ├── main.jsx
│       ├── index.css            # Tailwind + custom design system
│       ├── api/
│       │   └── axios.js         # Axios instance with JWT interceptor
│       ├── context/
│       │   └── AuthContext.jsx  # Auth state, login, signup, logout
│       ├── components/
│       │   ├── Navbar.jsx       # Sticky nav, mobile menu, admin link
│       │   ├── ProtectedRoute.jsx # Route guard using Outlet pattern
│       │   ├── TripCard.jsx     # Trip summary card with actions
│       │   ├── StopCard.jsx     # Stop display card
│       │   └── ActivityCard.jsx # Activity display card
│       └── pages/
│           ├── Login.jsx            # Email/password login
│           ├── Signup.jsx           # Full registration form
│           ├── Dashboard.jsx        # Hero, stats, popular cities, recent trips
│           ├── MyTrips.jsx          # All trips with filter tabs
│           ├── CreateTrip.jsx       # New trip form
│           ├── ItineraryBuilder.jsx # Stop management, day timeline, AI grouping
│           ├── ItineraryView.jsx    # Timeline/list view, Smart Day Plans display
│           ├── CitySearch.jsx       # Searchable city explorer with add-to-trip
│           ├── ActivitySearch.jsx   # AI suggestions + manual activity management
│           ├── SmartDayPlanner.jsx  # Day slot builder, AI optimizer, load meter
│           ├── BudgetBreakdown.jsx  # Pie/bar charts, expense CRUD, threshold alert
│           ├── PackingChecklist.jsx # Category checklist with progress bar
│           ├── TripNotes.jsx        # Journal with timestamps
│           ├── SharedItinerary.jsx  # Public trip view with copy & share
│           ├── UserProfile.jsx      # Edit profile, photo upload, favourites
│           └── AdminDashboard.jsx   # Platform stats, user table, ban/delete
│
├── travelloop.md                # Original project requirements document
└── README.md                    # This file
```

---

## 🖥️ Pages & Features

| Page | Route | Description |
|------|-------|-------------|
| **Login** | `/login` | Email + password auth |
| **Signup** | `/signup` | Full registration (name, email, phone, city, country) |
| **Dashboard** | `/dashboard` | Welcome hero, trip stats, popular destinations, recent trips |
| **My Trips** | `/my-trips` | All trips with upcoming/ongoing/completed tabs |
| **Create Trip** | `/trips/new` | Name, dates, description, public toggle |
| **Itinerary Builder** | `/trip/:id/build` | Stop management, reorder, AI grouping suggestions, day calendar |
| **Itinerary View** | `/trip/:id/view` | Timeline/list view, Smart Day Plans, total cost |
| **City Explorer** | `/cities` | Search and filter cities, add directly to trip |
| **Activity Search** | `/trip/:id/stop/:stopId/activities` | AI suggestions + manual add/remove |
| **Smart Day Planner** | `/trip/:id/day/:date/smart-plan` | Slot builder, AI optimizer, day load meter |
| **Budget Breakdown** | `/trip/:id/budget` | Pie & bar charts, expense CRUD, daily threshold warning |
| **Packing Checklist** | `/trip/:id/checklist` | Progress bar, category grouping, toggle, reset |
| **Trip Notes** | `/trip/:id/notes` | Journal entries with timestamps |
| **Shared Itinerary** | `/trip/share/:tripId` | Public trip view, copy to account, share link |
| **User Profile** | `/profile` | Edit info, photo upload, favourite cities, delete account |
| **Admin Dashboard** | `/admin` | Platform stats, trips/user charts, user table with ban |

---

## 🧠 AI Features (Gemini 2.0 Flash)

### Activity Suggestions
POST `/api/ai/suggest-activities`

Given a city, country, and existing activities, Gemini returns 5 tailored suggestions:
```json
[
  { "name": "Eiffel Tower Visit", "type": "sightseeing", "cost_usd": 25, "duration_minutes": 120, "description": "..." },
  ...
]
```
Types: `sightseeing | food | adventure | culture`

> **Without API key:** Returns realistic mock suggestions based on the city name.

---

### Day Optimization
POST `/api/ai/optimize-day`

Given multiple city slots with coordinates and activities, returns:
- Optimal visit order with `suggested_arrival` and `suggested_departure` times
- Travel times between stops (Haversine formula at 80 km/h)
- Overload detection (> 14 hours = overloaded day)
- Summary and warnings

> **Without API key:** Sorts by preferred time (morning → afternoon → evening) and calculates times mathematically.

---

### Nearby City Grouping
POST `/api/ai/suggest-nearby-grouping`

Automatically detects stops within 150 km of each other and suggests planning them on the same day.

---

## 🔐 Authentication

- **JWT tokens** with `python-jose` (HS256, 7-day expiry)
- **bcrypt** password hashing (no passlib — Python 3.14 compatible)
- Token stored in `localStorage`, auto-attached via Axios interceptor
- `get_current_user` dependency used on all protected endpoints
- Admin-only endpoints check `user.is_admin` flag

---

## 🗄️ Database Models

| Model | Key Fields |
|-------|-----------|
| `User` | id, name, email, hashed_password, phone, city, country, profile_photo, language, is_admin, is_banned |
| `Trip` | id, user_id, name, description, start_date, end_date, cover_photo, is_public |
| `Stop` | id, trip_id, city, country, arrival_date, departure_date, order_index |
| `Activity` | id, stop_id, name, type, cost, duration_minutes, description, is_selected |
| `BudgetItem` | id, trip_id, category, amount, note |
| `ChecklistItem` | id, trip_id, name, category, is_packed |
| `Note` | id, trip_id, stop_id, content, created_at |
| `City` | id, name, country, region, cost_index, popularity_score, latitude, longitude |
| `DayPlan` | id, trip_id, plan_date, label |
| `DayPlanSlot` | id, day_plan_id, city, country, latitude, longitude, arrival_time, departure_time, travel_time_from_prev_minutes, is_overloaded |
| `DayPlanSlotActivity` | id, slot_id, activity_name, type, cost, duration_minutes |
| `UserFavourite` | id, user_id, city_id |

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18 + Vite 5 |
| **Styling** | Tailwind CSS v4 + custom design tokens |
| **Routing** | React Router v6 (Outlet-based protected routes) |
| **HTTP Client** | Axios with JWT interceptor |
| **Charts** | Recharts (PieChart, BarChart, LineChart) |
| **Backend Framework** | FastAPI |
| **ORM** | SQLAlchemy |
| **Database** | SQLite (via `traveloop.db`) |
| **Auth** | JWT (`python-jose`) + bcrypt |
| **AI** | Google Gemini 2.0 Flash (`google-generativeai`) |
| **File Uploads** | FastAPI `python-multipart`, served via `/uploads` static |
| **Env Config** | `python-dotenv` |
| **Language** | Python 3.10+ / JavaScript (ES2022) |

---

## 📦 Backend Dependencies

```
fastapi
uvicorn[standard]
sqlalchemy
pymysql
python-jose[cryptography]
python-multipart
google-generativeai
python-dotenv
bcrypt
```

Install all with:
```bash
pip install -r requirements.txt
```

---

## 📦 Frontend Dependencies

```
react, react-dom, react-router-dom
axios
recharts
vite, @vitejs/plugin-react
@tailwindcss/vite
```

Install all with:
```bash
npm install
```

---

## 🌍 Seeded Cities

On first backend launch, 10 cities are automatically added to the database:

| City | Country | Region | Coords |
|------|---------|--------|--------|
| Paris | France | Europe | 48.86°N, 2.35°E |
| Tokyo | Japan | Asia | 35.68°N, 139.65°E |
| New York | USA | North America | 40.71°N, 74.01°W |
| Rome | Italy | Europe | 41.90°N, 12.50°E |
| Florence | Italy | Europe | 43.77°N, 11.26°E |
| Siena | Italy | Europe | 43.32°N, 11.33°E |
| Barcelona | Spain | Europe | 41.39°N, 2.17°E |
| Bangkok | Thailand | Asia | 13.76°N, 100.50°E |
| Dubai | UAE | Middle East | 25.20°N, 55.27°E |
| Cape Town | South Africa | Africa | 33.92°S, 18.42°E |

---

## 👑 Creating an Admin User

After starting the backend, create a user via signup then manually set `is_admin = 1` in the database:

```bash
# Using SQLite CLI
sqlite3 backend/traveloop.db "UPDATE users SET is_admin = 1 WHERE email = 'your@email.com';"
```

Admin users gain access to `/admin` dashboard with user management, ban toggle, and platform statistics.

---

## 🔄 API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update profile |
| POST | `/api/users/me/photo` | Upload profile photo |
| GET/POST/DELETE | `/api/users/me/favourites/:city_id` | Manage favourite cities |
| GET/POST | `/api/trips` | List / create trips |
| GET/PUT/DELETE | `/api/trips/:id` | Get / update / delete trip |
| POST | `/api/trips/:id/copy` | Copy a public trip |
| GET | `/api/trips/public/:id` | View a shared public trip |
| GET | `/api/trips/:id/budget-summary` | Aggregated budget summary |
| GET/POST | `/api/trips/:id/stops` | List / add stops |
| POST | `/api/trips/:id/stops/reorder` | Reorder stops |
| PUT/DELETE | `/api/trips/:id/stops/:stop_id` | Update / delete stop |
| GET/POST | `/api/stops/:id/activities` | List / add activities |
| DELETE/PATCH | `/api/stops/:id/activities/:act_id` | Delete / toggle activity |
| GET/POST | `/api/trips/:id/budget` | Budget items |
| DELETE | `/api/budget/:id` | Delete budget item |
| GET/POST | `/api/trips/:id/checklist` | Checklist items |
| PATCH | `/api/checklist/:id/toggle` | Toggle packed state |
| DELETE | `/api/checklist/:id` | Delete item |
| GET/POST | `/api/trips/:id/notes` | Notes |
| DELETE | `/api/notes/:id` | Delete note |
| GET/POST | `/api/trips/:id/day-plans` | Day plans |
| POST | `/api/day-plans/:id/slots` | Add slot |
| DELETE | `/api/slots/:id` | Remove slot |
| POST | `/api/day-plans/:id/apply-optimization` | Apply AI result |
| POST | `/api/ai/suggest-activities` | Gemini activity suggestions |
| POST | `/api/ai/optimize-day` | Gemini day optimizer |
| POST | `/api/ai/suggest-nearby-grouping` | Nearby city grouping |
| GET | `/api/cities` | Search cities |
| GET | `/api/cities/popular` | Top 6 by popularity |
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | All users list |
| DELETE | `/api/admin/users/:id` | Delete user |
| PATCH | `/api/admin/users/:id/ban` | Toggle ban status |

---

## ⚠️ Known Issues & Notes

- **First Run:** Delete `traveloop.db` if it exists from a previous version — the schema evolves with each update. Let the backend recreate it fresh.
- **JWT Auth:** The `sub` claim is stored as a string (required by `python-jose`). If you see 401 errors after updating auth, delete the old DB and re-register.
- **AI Fallback:** Without a `GEMINI_API_KEY`, all AI endpoints return high-quality mock data — the app is fully demo-able offline.
- **File Uploads:** Profile photos are saved to `backend/uploads/`. This folder is auto-created on startup.
- **Admin Access:** New users are non-admin by default. Use the SQLite CLI to promote a user (see above).

---

## 🧪 Testing the API

Once the backend is running, visit:

```
http://localhost:8000/docs
```

This opens the interactive Swagger UI where you can test every endpoint with authentication.

---

## 📸 Design System

TravelLoop uses a custom Tailwind-based design system with:
- **Glassmorphism** cards (`glass-card` class)
- **Gradient hero** sections (`gradient-hero`, `gradient-primary`)
- **Semantic badge system** (`badge-primary`, `badge-success`, `badge-secondary`)
- **Input fields** (`input-field`), **buttons** (`btn-primary`, `btn-outline`, `btn-ghost`)
- **Skeleton loaders** (`skeleton` class with shimmer animation)
- **Fade-in animations** (`animate-fade-in`)
- Google Fonts: **Inter** for body, **Poppins** for headings

---

## 👥 Team

**Team Error** — Built for the TravelLoop Full-Stack Challenge

| Role | Name |
|------|------|
| Full-Stack Dev | Vedant Patel |
| Backend / API | Team Error |
| UI / Design | Team Error |

---

## 📄 License

This project is built for the Team Error academic project submission.  
All rights reserved © 2026 Team Error.
