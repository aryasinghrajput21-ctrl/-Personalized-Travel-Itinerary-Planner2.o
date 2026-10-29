from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field
from datetime import date, datetime

class Activity(BaseModel):
    id: str
    time_slot: Literal['morning', 'afternoon', 'evening', 'night']
    title: str
    description: str
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    estimated_duration: str
    estimated_cost: float = 0.0
    currency: str = "USD"
    tags: List[str] = []
    tips: Optional[str] = None
    booking_required: bool = False
    completed: bool = False

class MealRecommendation(BaseModel):
    meal_type: Literal['breakfast', 'lunch', 'dinner', 'snack/cafe']
    name: str
    cuisine: str
    price_range: str
    estimated_cost: float = 0.0
    must_try: str
    neighborhood: str
    notes: Optional[str] = None

class DayPlan(BaseModel):
    day_number: int
    date: str
    theme: str
    summary: str
    morning: List[Activity] = []
    afternoon: List[Activity] = []
    evening: List[Activity] = []
    night: Optional[List[Activity]] = []
    meals: List[MealRecommendation] = []
    transportation_advice: str
    estimated_daily_cost: float = 0.0

class Accommodation(BaseModel):
    name: str
    type: str  # e.g., Boutique Hotel, Luxury Resort, Central Apartment, Budget Hostel
    neighborhood: str
    price_per_night: float
    total_estimated_cost: float
    why_recommended: str
    amenities: List[str] = []

class CostBreakdown(BaseModel):
    accommodations: float = 0.0
    activities: float = 0.0
    food_and_dining: float = 0.0
    transportation: float = 0.0
    buffer_contingency: float = 0.0
    total_estimated: float = 0.0

class PackingCategory(BaseModel):
    category: str
    items: List[str]

class ItineraryData(BaseModel):
    trip_summary: str
    destination_overview: str
    best_local_tips: List[str] = []
    packing_checklist: List[PackingCategory] = []
    route_optimization_notes: str
    cost_breakdown: CostBreakdown
    accommodations: List[Accommodation] = []
    daily_plans: List[DayPlan] = []

class TripCreateRequest(BaseModel):
    destination: str
    start_date: str
    end_date: str
    budget_tier: Literal['budget', 'moderate', 'luxury', 'custom'] = 'moderate'
    budget_amount: Optional[float] = 1500.0
    currency: str = "USD"
    group_size: int = 1
    group_type: Literal['solo', 'couple', 'family', 'friends'] = 'solo'
    travel_style: Literal['relaxed', 'balanced', 'fast_paced', 'adventure', 'culture', 'foodie', 'romantic', 'nature'] = 'balanced'
    interests: List[str] = []
    dietary_preferences: Optional[List[str]] = []
    special_requests: Optional[str] = None

class TripUpdateRequest(BaseModel):
    title: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget_tier: Optional[Literal['budget', 'moderate', 'luxury', 'custom']] = None
    budget_amount: Optional[float] = None
    group_size: Optional[int] = None
    group_type: Optional[Literal['solo', 'couple', 'family', 'friends']] = None
    travel_style: Optional[str] = None
    interests: Optional[List[str]] = None
    itinerary_data: Optional[ItineraryData] = None
    is_favorite: Optional[bool] = None
    status: Optional[str] = None

class RegenerateDayRequest(BaseModel):
    day_number: int
    instructions: Optional[str] = None
    focus_interests: Optional[List[str]] = None

class TripResponse(BaseModel):
    id: str
    user_id: str = "guest_user"
    title: str
    destination: str
    start_date: str
    end_date: str
    duration_days: int
    budget_tier: str
    budget_amount: float
    currency: str
    group_size: int
    group_type: str
    travel_style: str
    interests: List[str]
    itinerary_data: ItineraryData
    status: str = "active"
    is_favorite: bool = False
    created_at: str
    updated_at: str

class SystemConfigStatus(BaseModel):
    supabase_connected: bool
    gemini_configured: bool
    openai_configured: bool
    storage_mode: str
    active_ai_provider: str

