import os
import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.core.config import settings

class SupabaseService:
    def __init__(self):
        self.supabase_client = None
        self.storage_mode = "local_json"
        self.local_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "trips.json")
        os.makedirs(os.path.dirname(self.local_file_path), exist_ok=True)
        if not os.path.exists(self.local_file_path):
            with open(self.local_file_path, "w", encoding="utf-8") as f:
                json.dump([], f)
        
        self.init_supabase()

    def init_supabase(self):
        if settings.SUPABASE_URL and settings.SUPABASE_KEY and "your-supabase" not in settings.SUPABASE_URL:
            try:
                from supabase import create_client
                self.supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                self.storage_mode = "supabase"
                print(f"[SupabaseService] Connected to Supabase at {settings.SUPABASE_URL}")
            except Exception as e:
                print(f"[SupabaseService] Could not connect to Supabase: {e}. Falling back to local store.")
                self.supabase_client = None
                self.storage_mode = "local_json"
        else:
            self.storage_mode = "local_json"
            print("[SupabaseService] Supabase credentials not set. Using local JSON store.")

    def is_connected(self) -> bool:
        return self.storage_mode == "supabase" and self.supabase_client is not None

    def _read_local(self) -> List[Dict[str, Any]]:
        try:
            with open(self.local_file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_local(self, data: List[Dict[str, Any]]):
        with open(self.local_file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    async def create_trip(self, trip_dict: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in trip_dict or not trip_dict["id"]:
            trip_dict["id"] = str(uuid.uuid4())
        now_str = datetime.utcnow().isoformat() + "Z"
        if "created_at" not in trip_dict:
            trip_dict["created_at"] = now_str
        trip_dict["updated_at"] = now_str

        if self.is_connected():
            try:
                response = self.supabase_client.table("trips").insert(trip_dict).execute()
                if response.data and len(response.data) > 0:
                    return response.data[0]
            except Exception as e:
                print(f"[SupabaseService Error on insert]: {e}. Falling back to local storage.")
        
        # Local JSON fallback
        trips = self._read_local()
        trips.insert(0, trip_dict)
        self._write_local(trips)
        return trip_dict

    async def get_trips(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.is_connected():
            try:
                query = self.supabase_client.table("trips").select("*").order("created_at", desc=True)
                if user_id and user_id != "all":
                    query = query.eq("user_id", user_id)
                response = query.execute()
                return response.data or []
            except Exception as e:
                print(f"[SupabaseService Error on select]: {e}. Reading from local.")
        
        trips = self._read_local()
        if user_id and user_id != "all":
            trips = [t for t in trips if t.get("user_id") == user_id]
        return trips

    async def get_trip_by_id(self, trip_id: str) -> Optional[Dict[str, Any]]:
        if self.is_connected():
            try:
                response = self.supabase_client.table("trips").select("*").eq("id", trip_id).execute()
                if response.data and len(response.data) > 0:
                    return response.data[0]
            except Exception as e:
                print(f"[SupabaseService Error on get]: {e}")
        
        trips = self._read_local()
        for t in trips:
            if t.get("id") == trip_id:
                return t
        return None

    async def update_trip(self, trip_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        updates["updated_at"] = datetime.utcnow().isoformat() + "Z"

        if self.is_connected():
            try:
                response = self.supabase_client.table("trips").update(updates).eq("id", trip_id).execute()
                if response.data and len(response.data) > 0:
                    return response.data[0]
            except Exception as e:
                print(f"[SupabaseService Error on update]: {e}")
        
        trips = self._read_local()
        for idx, t in enumerate(trips):
            if t.get("id") == trip_id:
                trips[idx].update(updates)
                self._write_local(trips)
                return trips[idx]
        return None

    async def delete_trip(self, trip_id: str) -> bool:
        if self.is_connected():
            try:
                self.supabase_client.table("trips").delete().eq("id", trip_id).execute()
                return True
            except Exception as e:
                print(f"[SupabaseService Error on delete]: {e}")
        
        trips = self._read_local()
        new_trips = [t for t in trips if t.get("id") != trip_id]
        if len(new_trips) != len(trips):
            self._write_local(new_trips)
            return True
        return False

supabase_service = SupabaseService()

