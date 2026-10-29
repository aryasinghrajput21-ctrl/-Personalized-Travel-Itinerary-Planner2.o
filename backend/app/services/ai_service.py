import json
import os
import re
import math
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings
from app.models.schemas import (
    TripCreateRequest, ItineraryData, DayPlan, Activity,
    MealRecommendation, Accommodation, CostBreakdown, PackingCategory
)

# Known destination coordinate centers
KNOWN_DESTINATIONS = {
    "tokyo": {"lat": 35.6762, "lng": 139.6503, "currency": "JPY", "symbol": "¥"},
    "paris": {"lat": 48.8566, "lng": 2.3522, "currency": "EUR", "symbol": "€"},
    "rome": {"lat": 41.9028, "lng": 12.4964, "currency": "EUR", "symbol": "€"},
    "new york": {"lat": 40.7128, "lng": -74.0060, "currency": "USD", "symbol": "$"},
    "barcelona": {"lat": 41.3851, "lng": 2.1734, "currency": "EUR", "symbol": "€"},
    "london": {"lat": 51.5074, "lng": -0.1278, "currency": "GBP", "symbol": "£"},
    "bali": {"lat": -8.4095, "lng": 115.1889, "currency": "IDR", "symbol": "Rp"},
    "dubai": {"lat": 25.2048, "lng": 55.2708, "currency": "AED", "symbol": "AED"},
    "bangkok": {"lat": 13.7563, "lng": 100.5018, "currency": "THB", "symbol": "฿"},
    "singapore": {"lat": 1.3521, "lng": 103.8198, "currency": "SGD", "symbol": "S$"},
    "amsterdam": {"lat": 52.3676, "lng": 4.9041, "currency": "EUR", "symbol": "€"},
    "sydney": {"lat": -33.8688, "lng": 151.2093, "currency": "AUD", "symbol": "A$"},
    "kyoto": {"lat": 35.0116, "lng": 135.7681, "currency": "JPY", "symbol": "¥"},
    "san francisco": {"lat": 37.7749, "lng": -122.4194, "currency": "USD", "symbol": "$"},
    "seoul": {"lat": 37.5665, "lng": 126.9780, "currency": "KRW", "symbol": "₩"},
    "cairo": {"lat": 30.0444, "lng": 31.2357, "currency": "EGP", "symbol": "E£"},
}

class AIService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY

    def get_active_provider(self) -> str:
        if self.gemini_key and len(self.gemini_key) > 5:
            return "Google Gemini"
        if self.openai_key and len(self.openai_key) > 5:
            return "OpenAI"
        return "Built-in Procedural AI Engine"

    def _calculate_days(self, start_date_str: str, end_date_str: str) -> int:
        try:
            d1 = datetime.strptime(start_date_str, "%Y-%m-%d")
            d2 = datetime.strptime(end_date_str, "%Y-%m-%d")
            diff = (d2 - d1).days + 1
            return max(1, min(diff, 14))
        except Exception:
            return 3

    async def generate_itinerary(self, req: TripCreateRequest) -> ItineraryData:
        num_days = self._calculate_days(req.start_date, req.end_date)
        
        # 1. Try Gemini API if key is present
        if self.gemini_key and len(self.gemini_key) > 5:
            try:
                result = await self._generate_with_gemini(req, num_days)
                if result:
                    return result
            except Exception as e:
                print(f"[AIService] Gemini API error: {e}. Falling back...")

        # 2. Try OpenAI API if key is present
        if self.openai_key and len(self.openai_key) > 5:
            try:
                result = await self._generate_with_openai(req, num_days)
                if result:
                    return result
            except Exception as e:
                print(f"[AIService] OpenAI API error: {e}. Falling back...")

        # 3. Built-in Procedural Generative Engine
        return self._generate_procedural_itinerary(req, num_days)

    async def _generate_with_gemini(self, req: TripCreateRequest, num_days: int) -> Optional[ItineraryData]:
        prompt = self._build_prompt(req, num_days)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_key}"
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.4,
                "responseMimeType": "application/json"
            }
        }
        
        async with httpx.AsyncClient(timeout=40.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(raw_text)
                return ItineraryData(**parsed)
            else:
                print(f"Gemini API returned status {resp.status_code}: {resp.text}")
        return None

    async def _generate_with_openai(self, req: TripCreateRequest, num_days: int) -> Optional[ItineraryData]:
        prompt = self._build_prompt(req, num_days)
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are a master AI Travel Architect and Concierge. Return only valid JSON conforming strictly to the requested schema."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4
        }
        async with httpx.AsyncClient(timeout=40.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data["choices"][0]["message"]["content"]
                parsed = json.loads(raw_text)
                return ItineraryData(**parsed)
        return None

    def _build_prompt(self, req: TripCreateRequest, num_days: int) -> str:
        return f"""
Generate an ultra-personalized, geographically clustered {num_days}-day travel itinerary for {req.destination}.

Travel Details:
- Destination: {req.destination}
- Dates: {req.start_date} to {req.end_date} ({num_days} days)
- Traveler Group: {req.group_type} (Party size: {req.group_size})
- Travel Style: {req.travel_style}
- Budget Tier: {req.budget_tier} (Budget allocated: {req.budget_amount} {req.currency})
- Interests: {', '.join(req.interests) if req.interests else 'General highlights, culture, food'}
- Dietary Preferences: {', '.join(req.dietary_preferences) if req.dietary_preferences else 'None'}
- Special Requests: {req.special_requests or 'None'}

Key Instructions:
1. Ensure morning, afternoon, and evening activities are geographically clustered to minimize transit times.
2. Provide realistic latitude and longitude coordinates for each activity for interactive map plotting.
3. Include curated meal recommendations (breakfast, lunch, dinner, cafe) featuring authentic local cuisine.
4. Recommend 2-3 accommodations matching the {req.budget_tier} budget tier.
5. Provide a realistic cost breakdown matching the total budget of {req.budget_amount} {req.currency}.
6. Include a structured packing checklist and local insider advice (transport tips, etiquette, payment habits).

Return strict JSON with this exact schema:
{{
  "trip_summary": "string",
  "destination_overview": "string",
  "best_local_tips": ["string"],
  "packing_checklist": [
    {{"category": "Essentials", "items": ["Passport", "Currency"]}},
    {{"category": "Clothing", "items": ["Walking shoes", "Light jacket"]}},
    {{"category": "Electronics", "items": ["Universal adapter", "Power bank"]}},
    {{"category": "Health & Comfort", "items": ["Sunscreen", "Electrolytes"]}}
  ],
  "route_optimization_notes": "string",
  "cost_breakdown": {{
    "accommodations": float,
    "activities": float,
    "food_and_dining": float,
    "transportation": float,
    "buffer_contingency": float,
    "total_estimated": float
  }},
  "accommodations": [
    {{
      "name": "string",
      "type": "string",
      "neighborhood": "string",
      "price_per_night": float,
      "total_estimated_cost": float,
      "why_recommended": "string",
      "amenities": ["string"]
    }}
  ],
  "daily_plans": [
    {{
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "theme": "string",
      "summary": "string",
      "morning": [
        {{
          "id": "act-1-1",
          "time_slot": "morning",
          "title": "string",
          "description": "string",
          "location_name": "string",
          "latitude": float,
          "longitude": float,
          "estimated_duration": "2 hours",
          "estimated_cost": float,
          "currency": "{req.currency}",
          "tags": ["landmark", "culture"],
          "tips": "string",
          "booking_required": false,
          "completed": false
        }}
      ],
      "afternoon": [...same structure...],
      "evening": [...same structure...],
      "night": [...same structure or empty list...],
      "meals": [
        {{
          "meal_type": "breakfast",
          "name": "string",
          "cuisine": "string",
          "price_range": "$$",
          "estimated_cost": float,
          "must_try": "string",
          "neighborhood": "string",
          "notes": "string"
        }}
      ],
      "transportation_advice": "string",
      "estimated_daily_cost": float
    }}
  ]
}}
"""

    def _get_base_coords(self, dest: str) -> tuple[float, float]:
        dest_lower = dest.lower().strip()
        for key, coords in KNOWN_DESTINATIONS.items():
            if key in dest_lower or dest_lower in key:
                return coords["lat"], coords["lng"]
        
        # Deterministic coordinate hash for arbitrary destinations so pins cluster nicely
        hash_val = sum(ord(c) for c in dest_lower)
        lat = 20.0 + (hash_val % 40) + ((hash_val * 7) % 100) / 100.0
        lng = 10.0 + ((hash_val * 13) % 150) + ((hash_val * 3) % 100) / 100.0
        return round(lat, 4), round(lng, 4)

    def _generate_procedural_itinerary(self, req: TripCreateRequest, num_days: int) -> ItineraryData:
        dest = req.destination.strip()
        center_lat, center_lng = self._get_base_coords(dest)
        start_dt = datetime.strptime(req.start_date, "%Y-%m-%d")

        # Budget multipliers based on tier
        tier_multipliers = {
            "budget": 0.6,
            "moderate": 1.0,
            "luxury": 2.2,
            "custom": 1.0
        }
        mult = tier_multipliers.get(req.budget_tier, 1.0)
        user_budget = req.budget_amount or (1200.0 * mult)
        
        # Per person / per group scaling
        group_scale = max(1.0, req.group_size * 0.75)
        
        # Daily budget breakdown proportions
        daily_alloc = user_budget / num_days
        hotel_cost_night = round((daily_alloc * 0.42), 2)
        food_cost_day = round((daily_alloc * 0.28), 2)
        activity_cost_day = round((daily_alloc * 0.18), 2)
        transport_cost_day = round((daily_alloc * 0.08), 2)
        buffer_cost_day = round((daily_alloc * 0.04), 2)

        # Themes library
        theme_presets = [
            ("Iconic Landmarks & Historic Quarter", "Orient yourself with the most famous architectural wonders, historic plazas, and signature viewpoints."),
            ("Culinary Expedition & Artisan Markets", "Savor street eats, neighborhood food halls, and meet local craftsmen in heritage alleys."),
            ("Art, Culture & Scenic Hidden Alleys", "Immerse in world-class art collections, quiet historic corners, and bohemian cafes."),
            ("Nature Escapes & Waterfront Vistas", "Breathe in sweeping vistas, verdant botanical gardens, and scenic shoreline strolls."),
            ("Modern Architecture & Skyline Marvels", "Explore innovative districts, high-tech wonders, panoramic observatories, and vibrant promenades."),
            ("Local Neighborhoods & Bohemian Vibe", "Wander vibrant shopping avenues, independent boutiques, and authentic evening gathering spots."),
            ("Day Trip Adventure & Sunset Panorama", "Venture slightly beyond the city center for scenic views, castle ruins, and unforgettable sunsets."),
            ("Relaxed Leisure & Farewell Celebration", "Soak up the final ambiance at a leisurely pace with shopping, soothing parks, and an elevated dinner.")
        ]

        daily_plans: List[DayPlan] = []

        for day_idx in range(num_days):
            current_date = (start_dt + timedelta(days=day_idx)).strftime("%Y-%m-%d")
            theme_title, theme_summary = theme_presets[day_idx % len(theme_presets)]
            
            # Small coordinate jitter so points cluster geographically per day
            day_offset_lat = (math.sin(day_idx + 1) * 0.02)
            day_offset_lng = (math.cos(day_idx + 1) * 0.02)

            # Morning Activity
            m_lat = round(center_lat + day_offset_lat + 0.005, 4)
            m_lng = round(center_lng + day_offset_lng - 0.003, 4)
            morning_act = Activity(
                id=f"act-day{day_idx+1}-1",
                time_slot="morning",
                title=f"{dest} Highlights & Historic Quarter Discovery",
                description=f"Begin your morning at the heart of {dest}. Beat the crowds with an early morning walk through historic avenues, admiring centuries of architecture and iconic landmarks.",
                location_name=f"Historic Center, {dest}",
                latitude=m_lat,
                longitude=m_lng,
                estimated_duration="2.5 hours",
                estimated_cost=round(activity_cost_day * 0.4, 2),
                currency=req.currency,
                tags=["sightseeing", "history", req.travel_style],
                tips="Arrive before 9:30 AM to capture photos with the softest golden light and skip midday tour lines.",
                booking_required=False,
                completed=False
            )

            # Afternoon Activity
            a_lat = round(center_lat + day_offset_lat - 0.006, 4)
            a_lng = round(center_lng + day_offset_lng + 0.007, 4)
            afternoon_act = Activity(
                id=f"act-day{day_idx+1}-2",
                time_slot="afternoon",
                title=f"Art, Cultural Gallery & Artisan Arcade",
                description=f"Immerse yourself in {dest}'s renowned cultural heritage. Discover curated collections, local artisanal workshops, and quiet leafy courtyards.",
                location_name=f"Cultural Arts District, {dest}",
                latitude=a_lat,
                longitude=a_lng,
                estimated_duration="3 hours",
                estimated_cost=round(activity_cost_day * 0.6, 2),
                currency=req.currency,
                tags=["culture", "art", "photography"],
                tips="Check if combo museum passes are available online for priority skip-the-line entrance.",
                booking_required=(req.budget_tier in ["moderate", "luxury"]),
                completed=False
            )

            # Evening Activity
            e_lat = round(center_lat + day_offset_lat + 0.002, 4)
            e_lng = round(center_lng + day_offset_lng + 0.004, 4)
            evening_act = Activity(
                id=f"act-day{day_idx+1}-3",
                time_slot="evening",
                title=f"Sunset Promenade & Waterfront Golden Hour",
                description=f"Unwind with a scenic golden hour stroll along the most picturesque viewpoints of {dest}. Watch the city lights ignite as the sun dips below the horizon.",
                location_name=f"Panoramic Viewpoint Promenade, {dest}",
                latitude=e_lat,
                longitude=e_lng,
                estimated_duration="1.5 hours",
                estimated_cost=0.0,
                currency=req.currency,
                tags=["sunset", "relaxing", "views"],
                tips="A prime spot for unforgettable sunset photography; grab a local gelato or warm drink while taking in the views.",
                booking_required=False,
                completed=False
            )

            # Night Activity (for friends, couple, or adventure styles)
            night_acts = []
            if req.travel_style in ["adventure", "foodie", "balanced", "romantic"] or req.group_type in ["friends", "couple"]:
                n_lat = round(center_lat + day_offset_lat - 0.003, 4)
                n_lng = round(center_lng + day_offset_lng - 0.005, 4)
                night_acts.append(Activity(
                    id=f"act-day{day_idx+1}-4",
                    time_slot="night",
                    title=f"Night Market & Acoustic Rooftop Lounge",
                    description=f"Experience {dest}'s nocturnal charm with live acoustic performances or a vibrant night market filled with glowing lanterns and local night bites.",
                    location_name=f"Riverside Night Quarter, {dest}",
                    latitude=n_lat,
                    longitude=n_lng,
                    estimated_duration="2 hours",
                    estimated_cost=round(daily_alloc * 0.08, 2),
                    currency=req.currency,
                    tags=["nightlife", "music", "social"],
                    tips="Reservations recommended on weekend nights for outdoor terrace seating.",
                    booking_required=False,
                    completed=False
                ))

            # Curated Meals
            meals = [
                MealRecommendation(
                    meal_type="breakfast",
                    name=f"Cafe {dest} & Artisan Roasters",
                    cuisine="Local Artisanal Bakery & Espresso",
                    price_range="$" if req.budget_tier == "budget" else "$$",
                    estimated_cost=round(food_cost_day * 0.22, 2),
                    must_try="Freshly baked regional pastries and specialty pour-over roast",
                    neighborhood="Historic Old Quarter",
                    notes="Great outdoor terrace for people-watching and quick morning energy."
                ),
                MealRecommendation(
                    meal_type="lunch",
                    name=f"Bistrot {dest} Gourmet Market",
                    cuisine=f"Authentic {dest} Traditional Fare",
                    price_range="$$" if req.budget_tier != "luxury" else "$$$",
                    estimated_cost=round(food_cost_day * 0.35, 2),
                    must_try="Chef's seasonal prix-fixe luncheon plate",
                    neighborhood="Arts & Market District",
                    notes="Popular with local foodies; seasonal ingredients sourced daily."
                ),
                MealRecommendation(
                    meal_type="dinner",
                    name=f"L'Atelier {dest} Heritage Dining",
                    cuisine=f"Contemporary {dest} Cuisine",
                    price_range="$$$" if req.budget_tier == "luxury" else "$$",
                    estimated_cost=round(food_cost_day * 0.43, 2),
                    must_try="House specialty slow-cooked heritage delicacy paired with local wine",
                    neighborhood="Riverfront Promenade",
                    notes=f"Ideal atmosphere for {req.group_type} travelers."
                )
            ]

            day_plan = DayPlan(
                day_number=day_idx + 1,
                date=current_date,
                theme=f"Day {day_idx+1}: {theme_title}",
                summary=f"{theme_summary} Tailored specifically for {req.group_type} seeking a {req.travel_style} travel pace.",
                morning=[morning_act],
                afternoon=[afternoon_act],
                evening=[evening_act],
                night=night_acts,
                meals=meals,
                transportation_advice=f"Hop-on local metro lines or enjoy scenic walking paths between morning and afternoon clusters. Metro day pass estimated at ~{round(transport_cost_day, 1)} {req.currency}.",
                estimated_daily_cost=round(activity_cost_day + food_cost_day + transport_cost_day, 2)
            )
            daily_plans.append(day_plan)

        # Accommodations
        hotel_types = {
            "budget": ("Central Traveler's Boutique Hostel", "Cozy private room with shared social lounge and fast Wi-Fi"),
            "moderate": (f"The {dest} Grand Heritage Hotel", "Charming 4-star boutique hotel with complimentary artisanal breakfast"),
            "luxury": (f"The Royal {dest} Palace & Spa", "Luxury 5-star haven featuring panoramic rooftop pool and personalized butler service"),
            "custom": (f"Urban Retreat {dest} Lofts", "Modern serviced apartments with kitchenette and city skyline views")
        }
        h_name, h_desc = hotel_types.get(req.budget_tier, hotel_types["moderate"])

        accommodations = [
            Accommodation(
                name=h_name,
                type="Boutique Hotel" if req.budget_tier != "budget" else "Premium Hostel / Micro-hotel",
                neighborhood=f"Central Downtown, {dest}",
                price_per_night=hotel_cost_night,
                total_estimated_cost=round(hotel_cost_night * num_days, 2),
                why_recommended=f"Centrally located within 5 minutes of primary transit hubs. Perfectly matches {req.group_type} requirements.",
                amenities=["High-Speed Wi-Fi", "Daily Breakfast", "24/7 Front Desk", "Luggage Storage", "Concierge Service"]
            ),
            Accommodation(
                name=f"Villa Serenity Suites {dest}",
                type="Boutique Guesthouse",
                neighborhood=f"Garden Quarter, {dest}",
                price_per_night=round(hotel_cost_night * 1.15, 2),
                total_estimated_cost=round(hotel_cost_night * 1.15 * num_days, 2),
                why_recommended="Quiet tranquil sanctuary with courtyard garden, ideal for relaxing after full days of exploration.",
                amenities=["Garden Courtyard", "Coffee Bar", "Designer Toiletries", "Soundproof Rooms"]
            )
        ]

        total_hotel = round(hotel_cost_night * num_days, 2)
        total_activities = round(activity_cost_day * num_days, 2)
        total_food = round(food_cost_day * num_days, 2)
        total_transport = round(transport_cost_day * num_days, 2)
        total_buffer = round(buffer_cost_day * num_days, 2)
        total_calc = round(total_hotel + total_activities + total_food + total_transport + total_buffer, 2)

        cost_breakdown = CostBreakdown(
            accommodations=total_hotel,
            activities=total_activities,
            food_and_dining=total_food,
            transportation=total_transport,
            buffer_contingency=total_buffer,
            total_estimated=total_calc
        )

        packing_checklist = [
            PackingCategory(
                category="Essential Documents",
                items=["Passport & Physical ID copies", "Travel Insurance policy", "Hotel & transit QR vouchers", "Credit cards with zero foreign transaction fees"]
            ),
            PackingCategory(
                category="Clothing & Footwear",
                items=["Comfortable broken-in walking sneakers", "Versatile layering jackets", "Breathable evening attire", "Compact travel umbrella / rain shell"]
            ),
            PackingCategory(
                category="Tech & Gear",
                items=["Universal plug adapter with USB-C", "High-capacity power bank (10,000+ mAh)", "Noise-cancelling headphones", "Waterproof daypack"]
            ),
            PackingCategory(
                category="Health & Daily Comfort",
                items=["Hydration electrolyte packets", "Compact first-aid & blister pads", "Sunscreen (SPF 50+)", "Refillable insulated water bottle"]
            )
        ]

        best_local_tips = [
            f"Tipping in {dest}: Check local custom—in many venues service charges are pre-included.",
            "Transit: Purchase a rechargeable contactless transit card upon arrival at the central terminal to save up to 30% on single fares.",
            "Timing: Most flagship monuments are quietest right at opening (8:30-9:00 AM) or during late afternoon golden hour.",
            f"Cash vs Card: While cards are widely embraced across {dest}, carrying 30-50 {req.currency} in small banknotes is handy for street stalls and lockers."
        ]

        return ItineraryData(
            trip_summary=f"A meticulously crafted {num_days}-day itinerary in {dest} designed for {req.group_type} travelers seeking a {req.travel_style} rhythm across {req.budget_tier} budget standards.",
            destination_overview=f"{dest} blends historic soul with contemporary energy. From winding historic quarters and world-class dining to sunset viewpoints, every day is geographically optimized to prevent backtracking.",
            best_local_tips=best_local_tips,
            packing_checklist=packing_checklist,
            route_optimization_notes=f"Daily routes are grouped into micro-neighborhoods (Historic Center, Arts Quarter, Waterfront, and Scenic Overlooks) to maximize sightseeing time and minimize commuting fatigue.",
            cost_breakdown=cost_breakdown,
            accommodations=accommodations,
            daily_plans=daily_plans
        )

    async def regenerate_day(self, trip: Dict[str, Any], day_number: int, instructions: Optional[str] = None, focus_interests: Optional[List[str]] = None) -> DayPlan:
        # Extract destination and trip details
        dest = trip.get("destination", "Destination")
        center_lat, center_lng = self._get_base_coords(dest)
        currency = trip.get("currency", "USD")
        travel_style = trip.get("travel_style", "balanced")
        group_type = trip.get("group_type", "solo")
        
        # Calculate date for this day
        start_date_str = trip.get("start_date", "2026-11-01")
        try:
            start_dt = datetime.strptime(start_date_str, "%Y-%m-%d")
            day_dt = start_dt + timedelta(days=day_number - 1)
            date_str = day_dt.strftime("%Y-%m-%d")
        except Exception:
            date_str = start_date_str

        interests_str = ", ".join(focus_interests) if focus_interests else "hidden gems, dining, culture"
        custom_note = f" (Refined based on: {instructions})" if instructions else ""

        # New themed day plan
        morning_act = Activity(
            id=f"act-day{day_number}-m-regen",
            time_slot="morning",
            title=f"Curated {dest} Discovery: {interests_str.capitalize()}",
            description=f"Fresh morning exploration customized to your preferences{custom_note}. Discover authentic corners away from standard tourist corridors.",
            location_name=f"Artisan Quarter, {dest}",
            latitude=round(center_lat + 0.008, 4),
            longitude=round(center_lng - 0.005, 4),
            estimated_duration="2.5 hours",
            estimated_cost=25.0,
            currency=currency,
            tags=focus_interests or ["curated", travel_style],
            tips="Wear comfortable shoes and take time to engage with local storekeepers.",
            booking_required=False,
            completed=False
        )

        afternoon_act = Activity(
            id=f"act-day{day_number}-a-regen",
            time_slot="afternoon",
            title=f"Interactive Workshop & Signature Experience in {dest}",
            description=f"Engage in an enriching hands-on cultural or foodie session tailored to your interests{custom_note}.",
            location_name=f"Craft & Heritage Studio, {dest}",
            latitude=round(center_lat - 0.004, 4),
            longitude=round(center_lng + 0.006, 4),
            estimated_duration="3 hours",
            estimated_cost=45.0,
            currency=currency,
            tags=["immersive", "hands-on"],
            tips="Advance reservation confirmed upon arrival.",
            booking_required=True,
            completed=False
        )

        evening_act = Activity(
            id=f"act-day{day_number}-e-regen",
            time_slot="evening",
            title=f"Twilight Scenic Views & Vibrant Promenade",
            description=f"Take in twilight views of {dest} from an elevated terrace or riverside walk.",
            location_name=f"Skyline Terrace, {dest}",
            latitude=round(center_lat + 0.003, 4),
            longitude=round(center_lng + 0.002, 4),
            estimated_duration="2 hours",
            estimated_cost=20.0,
            currency=currency,
            tags=["sunset", "ambiance"],
            tips="Ideal spot for photography and winding down.",
            booking_required=False,
            completed=False
        )

        meals = [
            MealRecommendation(
                meal_type="breakfast",
                name=f"Boutique Espresso & Pastry Bar",
                cuisine="Artisanal Bakery",
                price_range="$$",
                estimated_cost=15.0,
                must_try="Handmade morning brioche & specialty flat white",
                neighborhood="Central Plaza",
                notes="Cozy, relaxed atmosphere."
            ),
            MealRecommendation(
                meal_type="lunch",
                name=f"Locals' Choice Trattoria",
                cuisine=f"Regional {dest} Specialties",
                price_range="$$",
                estimated_cost=28.0,
                must_try="Chef's signature handmade specialty dish",
                neighborhood="Historic Core",
                notes="Loved by locals for authentic flavors."
            ),
            MealRecommendation(
                meal_type="dinner",
                name=f"Atmospheric Terrace Bistro",
                cuisine="Modern Fusion",
                price_range="$$$",
                estimated_cost=45.0,
                must_try="Signature grilled local delicacy",
                neighborhood="Riverfront",
                notes="Candlelit seating with ambient music."
            )
        ]

        return DayPlan(
            day_number=day_number,
            date=date_str,
            theme=f"Day {day_number}: Curated {interests_str.title()}",
            summary=f"Custom-regenerated day plan incorporating your direct preferences: {instructions or 'Focused cultural immersion'}.",
            morning=[morning_act],
            afternoon=[afternoon_act],
            evening=[evening_act],
            night=[],
            meals=meals,
            transportation_advice="Scenic neighborhood walking combined with short 5-minute metro hops.",
            estimated_daily_cost=153.0
        )

ai_service = AIService()

