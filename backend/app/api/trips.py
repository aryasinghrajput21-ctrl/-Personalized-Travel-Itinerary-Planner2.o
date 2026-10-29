from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
import uuid
from datetime import datetime

from app.models.schemas import (
    TripCreateRequest, TripResponse, TripUpdateRequest,
    RegenerateDayRequest, DayPlan, SystemConfigStatus
)
from app.services.ai_service import ai_service
from app.services.supabase_service import supabase_service
from app.core.config import settings

router = APIRouter(prefix="/trips", tags=["trips"])

@router.get("/config/status", response_model=SystemConfigStatus)
async def get_config_status():
    return SystemConfigStatus(
        supabase_connected=supabase_service.is_connected(),
        gemini_configured=bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5),
        openai_configured=bool(settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY) > 5),
        storage_mode=supabase_service.storage_mode,
        active_ai_provider=ai_service.get_active_provider()
    )

@router.post("/generate", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_and_generate_trip(req: TripCreateRequest):
    try:
        # 1. AI generation
        itinerary = await ai_service.generate_itinerary(req)
        
        # Calculate duration
        d1 = datetime.strptime(req.start_date, "%Y-%m-%d")
        d2 = datetime.strptime(req.end_date, "%Y-%m-%d")
        duration = max(1, (d2 - d1).days + 1)
        
        trip_id = str(uuid.uuid4())
        title = f"{duration}-Day {req.travel_style.capitalize()} Getaway in {req.destination}"
        now_str = datetime.utcnow().isoformat() + "Z"
        
        trip_dict = {
            "id": trip_id,
            "user_id": "guest_user",
            "title": title,
            "destination": req.destination,
            "start_date": req.start_date,
            "end_date": req.end_date,
            "duration_days": duration,
            "budget_tier": req.budget_tier,
            "budget_amount": req.budget_amount or 1500.0,
            "currency": req.currency,
            "group_size": req.group_size,
            "group_type": req.group_type,
            "travel_style": req.travel_style,
            "interests": req.interests,
            "itinerary_data": itinerary.model_dump(),
            "status": "active",
            "is_favorite": False,
            "created_at": now_str,
            "updated_at": now_str
        }
        
        saved_trip = await supabase_service.create_trip(trip_dict)
        return saved_trip
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate trip: {str(e)}")

@router.get("", response_model=List[TripResponse])
async def list_trips(
    user_id: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    favorite_only: Optional[bool] = Query(False)
):
    trips = await supabase_service.get_trips(user_id=user_id or "guest_user")
    
    if destination:
        trips = [t for t in trips if destination.lower() in t.get("destination", "").lower()]
    if favorite_only:
        trips = [t for t in trips if t.get("is_favorite") is True]
        
    return trips

@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str):
    trip = await supabase_service.get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(trip_id: str, updates: TripUpdateRequest):
    existing = await supabase_service.get_trip_by_id(trip_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    update_dict = updates.model_dump(exclude_unset=True)
    if "itinerary_data" in update_dict and update_dict["itinerary_data"] is not None:
        # Keep as dict
        pass

    updated = await supabase_service.update_trip(trip_id, update_dict)
    return updated

@router.delete("/{trip_id}")
async def delete_trip(trip_id: str):
    existing = await supabase_service.get_trip_by_id(trip_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    success = await supabase_service.delete_trip(trip_id)
    return {"success": success, "deleted_id": trip_id}

@router.post("/{trip_id}/regenerate-day", response_model=TripResponse)
async def regenerate_trip_day(trip_id: str, req: RegenerateDayRequest):
    trip = await supabase_service.get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    itinerary_data = trip.get("itinerary_data", {})
    daily_plans = itinerary_data.get("daily_plans", [])
    
    # Generate new day plan
    new_day_plan = await ai_service.regenerate_day(
        trip=trip,
        day_number=req.day_number,
        instructions=req.instructions,
        focus_interests=req.focus_interests
    )
    
    # Replace day in daily_plans
    found = False
    for idx, d in enumerate(daily_plans):
        if d.get("day_number") == req.day_number:
            daily_plans[idx] = new_day_plan.model_dump()
            found = True
            break
            
    if not found:
        daily_plans.append(new_day_plan.model_dump())
        
    itinerary_data["daily_plans"] = daily_plans
    updated_trip = await supabase_service.update_trip(trip_id, {"itinerary_data": itinerary_data})
    return updated_trip

@router.post("/{trip_id}/regenerate-all", response_model=TripResponse)
async def regenerate_full_itinerary(trip_id: str):
    trip = await supabase_service.get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    req = TripCreateRequest(
        destination=trip["destination"],
        start_date=trip["start_date"],
        end_date=trip["end_date"],
        budget_tier=trip.get("budget_tier", "moderate"),
        budget_amount=trip.get("budget_amount", 1500.0),
        currency=trip.get("currency", "USD"),
        group_size=trip.get("group_size", 1),
        group_type=trip.get("group_type", "solo"),
        travel_style=trip.get("travel_style", "balanced"),
        interests=trip.get("interests", [])
    )
    
    new_itinerary = await ai_service.generate_itinerary(req)
    updated_trip = await supabase_service.update_trip(trip_id, {
        "itinerary_data": new_itinerary.model_dump()
    })
    return updated_trip

