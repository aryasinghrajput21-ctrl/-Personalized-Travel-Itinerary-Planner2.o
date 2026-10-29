import React, { useState } from 'react';
import { X, Database, Brain, Check, Copy, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';

export default function SystemStatusModal({ isOpen, onClose, systemStatus }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isSupabase = systemStatus?.storage_mode === 'supabase';

  const sqlCode = `-- Supabase Table Setup (Run in SQL Editor):
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'guest_user',
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER NOT NULL,
    budget_tier TEXT NOT NULL,
    budget_amount NUMERIC(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    group_size INTEGER NOT NULL DEFAULT 1,
    group_type TEXT NOT NULL,
    travel_style TEXT NOT NULL DEFAULT 'balanced',
    interests JSONB DEFAULT '[]'::jsonb,
    itinerary_data JSONB NOT NULL,
    status TEXT DEFAULT 'active',
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all" ON public.trips FOR ALL USING (true);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">System & Integration Status</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-700">
          
          {/* Storage Status Card */}
          <div className={`p-4 rounded-2xl border ${isSupabase ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 mb-1">
                <Database className={`w-4 h-4 ${isSupabase ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span className="font-bold text-sm text-slate-900">
                  Storage Mode: {isSupabase ? 'Supabase Postgres Active' : 'Local JSON Active (Zero-Setup)'}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isSupabase ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-900'
              }`}>
                {isSupabase ? 'Connected' : 'Local Fallback'}
              </span>
            </div>
            <p className="text-slate-600 mt-1 leading-relaxed">
              {isSupabase
                ? 'Your itineraries are persisting directly to your connected Supabase PostgreSQL database with Row Level Security enabled.'
                : 'Trips are currently saved to your server data store (backend/data/trips.json). To sync to cloud Supabase, simply provide SUPABASE_URL and SUPABASE_KEY in backend/.env.'}
            </p>
          </div>

          {/* AI Provider Status Card */}
          <div className="p-4 rounded-2xl border bg-indigo-50/40 border-indigo-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-sm text-slate-900">
                  AI Engine: {systemStatus?.active_ai_provider || 'Built-in Engine'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase">
                Active
              </span>
            </div>
            <p className="text-slate-600 mt-1 leading-relaxed">
              Equipped with intelligent geographic route clustering, day-wise morning/afternoon/night scheduling, curated authentic dining, and realistic coordinate geo-pinning for global destinations.
            </p>
          </div>

          {/* Supabase Schema Instructions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Supabase SQL Setup Script
              </span>
              <button
                onClick={copySql}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied SQL!' : 'Copy SQL'}</span>
              </button>
            </div>
            <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[10px] overflow-x-auto max-h-36">
              <pre>{sqlCode}</pre>
            </div>
          </div>

        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

