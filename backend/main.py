import sys
import os

# Fix Windows console UTF-8 encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.core.config import settings
from app.api.trips import router as trips_router
from app.services.supabase_service import supabase_service
from app.services.ai_service import ai_service
from app.models.schemas import TripCreateRequest

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("==================================================")
    print("[INIT] AI Travel Itinerary Planner Backend Starting...")
    print(f"[INIT] Storage Mode: {supabase_service.storage_mode}")
    print(f"[INIT] Active AI Provider: {ai_service.get_active_provider()}")
    print("==================================================")
    
    # Check if any trips exist; if not, seed a stellar demo trip
    trips = await supabase_service.get_trips()
    if len(trips) == 0:
        print("[Seeding] Creating sample trip to Kyoto & Tokyo for initial demo...")
        sample_req = TripCreateRequest(
            destination="Kyoto, Japan",
            start_date="2026-11-10",
            end_date="2026-11-13",
            budget_tier="moderate",
            budget_amount=1800.0,
            currency="USD",
            group_size=2,
            group_type="couple",
            travel_style="culture",
            interests=["Temples & Shrines", "Tea Ceremonies", "Bamboo Forest", "Kaiseki Dining", "Traditional Onsen"]
        )
        sample_itin = await ai_service.generate_itinerary(sample_req)
        await supabase_service.create_trip({
            "id": "demo-kyoto-getaway",
            "user_id": "guest_user",
            "title": "4-Day Cultural Romance in Kyoto",
            "destination": "Kyoto, Japan",
            "start_date": "2026-11-10",
            "end_date": "2026-11-13",
            "duration_days": 4,
            "budget_tier": "moderate",
            "budget_amount": 1800.0,
            "currency": "USD",
            "group_size": 2,
            "group_type": "couple",
            "travel_style": "culture",
            "interests": sample_req.interests,
            "itinerary_data": sample_itin.model_dump(),
            "status": "active",
            "is_favorite": True,
            "created_at": "2026-10-29T12:00:00Z",
            "updated_at": "2026-10-29T12:00:00Z"
        })
        print("[Seeding] Demo trip successfully seeded!")
        
    yield
    print("[SHUTDOWN] Shutting down backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-stack AI Personalized Travel Itinerary Planner API",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(trips_router, prefix="/api")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "storage_mode": supabase_service.storage_mode,
        "supabase_connected": supabase_service.is_connected(),
        "ai_provider": ai_service.get_active_provider()
    }

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API. Docs available at /docs",
        "health": "/health",
        "trips_api": "/api/trips"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
