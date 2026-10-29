import React from 'react';
import { Calendar, Users, DollarSign, Heart, Trash2, Edit3, ArrowRight, Sparkles, MapPin, Compass } from 'lucide-react';

export default function TripCard({ trip, onSelect, onToggleFavorite, onEdit, onDelete }) {
  const daysCount = trip.duration_days || 1;
  const days = trip.itinerary_data?.daily_plans || [];
  
  const groupTypeLabels = {
    solo: 'Solo Traveler',
    couple: 'Couple',
    family: 'Family Trip',
    friends: 'Group of Friends',
  };

  const budgetTierBadges = {
    budget: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    moderate: 'bg-blue-50 text-blue-700 border-blue-200',
    luxury: 'bg-purple-50 text-purple-700 border-purple-200',
    custom: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      
      {/* Top Banner & Destination Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <MapPin className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              {trip.destination}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(trip);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                trip.is_favorite
                  ? 'text-rose-500 bg-rose-50'
                  : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
              }`}
              title="Favorite Trip"
            >
              <Heart className={`w-4 h-4 ${trip.is_favorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(trip);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Edit Trip"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(trip.id);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Trip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 
          onClick={() => onSelect(trip)}
          className="text-base font-bold text-slate-900 line-clamp-1 hover:text-indigo-600 cursor-pointer transition-colors"
        >
          {trip.title}
        </h3>

        {/* Summary Snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">
          {trip.itinerary_data?.trip_summary || `Customized ${trip.travel_style} adventure tailored for ${trip.group_type}.`}
        </p>

        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${budgetTierBadges[trip.budget_tier] || budgetTierBadges.moderate}`}>
            {trip.budget_tier ? trip.budget_tier.toUpperCase() : 'MODERATE'} · ${trip.budget_amount ? Number(trip.budget_amount).toLocaleString() : '1,500'}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            {groupTypeLabels[trip.group_type] || 'Solo'}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 capitalize">
            {trip.travel_style} Pace
          </span>
        </div>
      </div>

      {/* Middle preview snippet: Day highlight */}
      <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 text-xs">
        <div className="flex items-center justify-between text-slate-600 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-medium">{trip.start_date} → {trip.end_date}</span>
          </div>
          <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
            {daysCount} {daysCount === 1 ? 'Day' : 'Days'}
          </span>
        </div>

        {days.length > 0 && (
          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span className="font-medium text-slate-700">Day 1:</span>
            <span className="truncate">{days[0]?.theme || 'Arrival & Highlights'}</span>
          </div>
        )}
      </div>

      {/* Card Footer CTA */}
      <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>AI Generated</span>
        </div>

        <button
          onClick={() => onSelect(trip)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white text-xs font-semibold transition-all group-hover:bg-indigo-600 group-hover:text-white"
        >
          <span>View Itinerary</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

    </div>
  );
}

