-- Supabase Schema for AI Personalized Travel Itinerary Planner
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the trips table
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'guest_user',
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    budget_tier TEXT NOT NULL CHECK (budget_tier IN ('budget', 'moderate', 'luxury', 'custom')),
    budget_amount NUMERIC(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    group_size INTEGER NOT NULL DEFAULT 1 CHECK (group_size > 0),
    group_type TEXT NOT NULL CHECK (group_type IN ('solo', 'couple', 'family', 'friends')),
    travel_style TEXT NOT NULL DEFAULT 'balanced',
    interests JSONB DEFAULT '[]'::jsonb,
    itinerary_data JSONB NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- 5. Policies: Allow all operations for anon/service roles for easy plug-and-play SaaS demo
CREATE POLICY "Allow public read access to trips"
    ON public.trips FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert to trips"
    ON public.trips FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update to trips"
    ON public.trips FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete to trips"
    ON public.trips FOR DELETE
    USING (true);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_trips_updated_at ON public.trips;
CREATE TRIGGER trigger_trips_updated_at
    BEFORE UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION update_trips_updated_at();

