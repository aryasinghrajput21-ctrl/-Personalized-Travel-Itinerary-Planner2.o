import React from 'react';
import { Compass, Sparkles, Database, Plus, MapPin, Globe } from 'lucide-react';

export default function Navbar({ onOpenNewTrip, onOpenStatus, systemStatus, activeView, setActiveView, selectedTrip }) {
  const isSupabase = systemStatus?.storage_mode === 'supabase';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">Wanderlust<span className="text-indigo-600">AI</span></span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                SaaS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">AI Personalized Itinerary Planner</p>
          </div>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Trips
          </button>
          {selectedTrip && (
            <button
              onClick={() => setActiveView('itinerary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'itinerary'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{selectedTrip.destination}</span>
            </button>
          )}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Storage / System Status Badge */}
          <button
            onClick={onOpenStatus}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isSupabase
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title="Click to view Supabase & AI status"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSupabase ? 'Supabase Synced' : 'Local Storage Mode'}
            </span>
            <span className={`w-2 h-2 rounded-full ${isSupabase ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          </button>

          {/* New Trip Button */}
          <button
            onClick={onOpenNewTrip}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Plan New Trip</span>
            <span className="sm:hidden">Plan</span>
          </button>
        </div>

      </div>
    </header>
  );
}

