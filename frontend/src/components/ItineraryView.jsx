import React, { useState } from 'react';
import { 
  ArrowLeft, Calendar, Users, DollarSign, MapPin, Sparkles, 
  Printer, RefreshCw, Plus, CheckCircle2, Circle, Clock, Tag, 
  Bed, Utensils, Compass, Bus, Info, CheckSquare, Square, 
  Trash2, Edit3, ChevronRight, Share2, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import InteractiveMap from './InteractiveMap';
import AddActivityModal from './AddActivityModal';
import RegenerateDayModal from './RegenerateDayModal';
import ExportModal from './ExportModal';
import EditTripModal from './EditTripModal';

export default function ItineraryView({ trip, onBack, onUpdateTrip, onRegenerateDay, onRegenerateAll, isRegenerating }) {
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline', 'map', 'budget', 'stays', 'packing'
  const [selectedDayNumber, setSelectedDayNumber] = useState(1); // 1, 2, ... or null for all
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  if (!trip) return null;

  const itinerary = trip.itinerary_data || {};
  const dailyPlans = itinerary.daily_plans || [];
  const accommodations = itinerary.accommodations || [];
  const costBreakdown = itinerary.cost_breakdown || {};
  const packingChecklist = itinerary.packing_checklist || [];
  const localTips = itinerary.best_local_tips || [];

  // Currently filtered day or all days
  const displayedDays = selectedDayNumber 
    ? dailyPlans.filter(d => d.day_number === selectedDayNumber)
    : dailyPlans;

  // Gather activities for map
  const mapActivities = selectedDayNumber
    ? [
        ...(displayedDays[0]?.morning || []),
        ...(displayedDays[0]?.afternoon || []),
        ...(displayedDays[0]?.evening || []),
        ...(displayedDays[0]?.night || []),
      ]
    : dailyPlans.flatMap(d => [
        ...(d.morning || []),
        ...(d.afternoon || []),
        ...(d.evening || []),
        ...(d.night || []),
      ]);

  // Handle toggling activity completion
  const handleToggleActivity = (dayNumber, activityId) => {
    const updatedPlans = dailyPlans.map(day => {
      if (day.day_number !== dayNumber) return day;

      const updateSlot = (list = []) =>
        list.map(act => act.id === activityId ? { ...act, completed: !act.completed } : act);

      return {
        ...day,
        morning: updateSlot(day.morning),
        afternoon: updateSlot(day.afternoon),
        evening: updateSlot(day.evening),
        night: updateSlot(day.night),
      };
    });

    onUpdateTrip(trip.id, {
      itinerary_data: {
        ...itinerary,
        daily_plans: updatedPlans,
      }
    });
  };

  // Handle deleting activity
  const handleDeleteActivity = (dayNumber, activityId) => {
    const updatedPlans = dailyPlans.map(day => {
      if (day.day_number !== dayNumber) return day;

      const filterSlot = (list = []) => list.filter(act => act.id !== activityId);

      return {
        ...day,
        morning: filterSlot(day.morning),
        afternoon: filterSlot(day.afternoon),
        evening: filterSlot(day.evening),
        night: filterSlot(day.night),
      };
    });

    onUpdateTrip(trip.id, {
      itinerary_data: {
        ...itinerary,
        daily_plans: updatedPlans,
      }
    });
  };

  // Handle adding custom activity
  const handleAddCustomActivity = (dayNumber, newActivity) => {
    const updatedPlans = dailyPlans.map(day => {
      if (day.day_number !== dayNumber) return day;

      const slotKey = newActivity.time_slot;
      return {
        ...day,
        [slotKey]: [...(day[slotKey] || []), newActivity]
      };
    });

    onUpdateTrip(trip.id, {
      itinerary_data: {
        ...itinerary,
        daily_plans: updatedPlans,
      }
    });
  };

  // Toggle packing checklist checkbox
  const togglePackingItem = (itemKey) => {
    setCheckedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        
        {/* Left: Back & Title */}
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Trips</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
              <MapPin className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              {trip.destination}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">
              {trip.start_date} → {trip.end_date} ({trip.duration_days} Days)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {trip.title}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Trip</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export / Print</span>
          </button>

          <button
            onClick={() => onRegenerateAll(trip.id)}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white text-xs font-bold border border-indigo-200 shadow-2xs transition-all disabled:opacity-50"
            title="Re-run AI on the entire itinerary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Trip'}</span>
          </button>
        </div>
      </div>

      {/* Overview Banner Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full border border-indigo-400/30 backdrop-blur-xs">
              {trip.group_type?.toUpperCase()} VOYAGE
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/10 text-white px-3 py-1 rounded-full border border-white/10 backdrop-blur-xs">
              {trip.travel_style} Pace
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-400/30 backdrop-blur-xs">
              {trip.budget_tier?.toUpperCase()} · ${trip.budget_amount} {trip.currency}
            </span>
          </div>

          <p className="text-sm sm:text-base text-indigo-100 font-medium leading-relaxed">
            {itinerary.trip_summary}
          </p>

          {trip.interests && trip.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {trip.interests.map((tag, idx) => (
                <span key={idx} className="text-[11px] bg-white/15 px-2.5 py-0.5 rounded-lg text-indigo-100 font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'timeline', label: 'Day-by-Day Timeline', icon: Calendar },
          { id: 'map', label: 'Route Map', icon: MapPin },
          { id: 'budget', label: 'Budget Breakdown', icon: DollarSign },
          { id: 'stays', label: 'Accommodations', icon: Bed },
          { id: 'packing', label: 'Packing & Local Advice', icon: CheckSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DAY-BY-DAY TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          
          {/* Day Selector Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => setSelectedDayNumber(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDayNumber === null
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Days ({dailyPlans.length})
              </button>
              {dailyPlans.map((day) => (
                <button
                  key={day.day_number}
                  onClick={() => setSelectedDayNumber(day.day_number)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedDayNumber === day.day_number
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Day {day.day_number}
                </button>
              ))}
            </div>

            {/* Quick action buttons for the current day */}
            {selectedDayNumber && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 text-xs font-bold shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Add Stop</span>
                </button>
                <button
                  onClick={() => setShowRegenModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Regenerate Day {selectedDayNumber}</span>
                </button>
              </div>
            )}
          </div>

          {/* Days Loop */}
          <div className="space-y-8">
            {displayedDays.map((day) => (
              <div key={day.day_number} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                
                {/* Day Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        Day {day.day_number}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {day.date}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">{day.theme}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{day.summary}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      Est. Daily: ${day.estimated_daily_cost || 0}
                    </span>
                    {selectedDayNumber === null && (
                      <button
                        onClick={() => {
                          setSelectedDayNumber(day.day_number);
                          setShowRegenModal(true);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title={`Regenerate Day ${day.day_number}`}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scheduled Time Slots */}
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { slot: 'morning', title: 'Morning Exploration', items: day.morning, badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
                    { slot: 'afternoon', title: 'Afternoon Discovery', items: day.afternoon, badgeClass: 'bg-blue-50 text-blue-800 border-blue-200' },
                    { slot: 'evening', title: 'Evening Ambiance', items: day.evening, badgeClass: 'bg-violet-50 text-violet-800 border-violet-200' },
                    { slot: 'night', title: 'Night Life & Stargazing', items: day.night, badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
                  ]
                    .filter(sec => sec.items && sec.items.length > 0)
                    .map((sec) => (
                      <div key={sec.slot} className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${sec.badgeClass}`}>
                            {sec.slot}
                          </span>
                          <span className="text-xs font-bold text-slate-700">{sec.title}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {sec.items.map((act) => (
                            <div
                              key={act.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                act.completed
                                  ? 'bg-slate-50/70 border-slate-200 opacity-60'
                                  : 'bg-white border-slate-200 hover:border-indigo-200 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                
                                <div className="flex items-start gap-3">
                                  {/* Completion toggle */}
                                  <button
                                    onClick={() => handleToggleActivity(day.day_number, act.id)}
                                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                    title={act.completed ? 'Mark unvisited' : 'Mark visited'}
                                  >
                                    {act.completed ? (
                                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-600" />
                                    )}
                                  </button>

                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className={`font-bold text-sm ${act.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                        {act.title}
                                      </h3>
                                      {act.booking_required && (
                                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                                          Booking Recommended
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>{act.location_name}</span>
                                      </span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{act.estimated_duration}</span>
                                      </span>
                                      <span>•</span>
                                      <span className="font-bold text-slate-700">
                                        {act.estimated_cost > 0 ? `$${act.estimated_cost} ${act.currency}` : 'Free'}
                                      </span>
                                    </div>

                                    <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                                      {act.description}
                                    </p>

                                    {/* Tips Alert box */}
                                    {act.tips && (
                                      <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                                        <span className="font-bold text-amber-700">💡 Tip:</span>
                                        <span>{act.tips}</span>
                                      </div>
                                    )}

                                    {/* Tags */}
                                    {act.tags && act.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pt-1.5">
                                        {act.tags.map((t, idx) => (
                                          <span key={idx} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                            #{t}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Delete activity */}
                                <button
                                  onClick={() => handleDeleteActivity(day.day_number, act.id)}
                                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove this stop"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Meals Section */}
                {day.meals && day.meals.length > 0 && (
                  <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Curated Dining & Cafes
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {day.meals.map((meal, idx) => (
                        <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {meal.meal_type}
                            </span>
                            <span className="font-bold text-slate-700">
                              {meal.price_range} (${meal.estimated_cost})
                            </span>
                          </div>
                          <div className="font-bold text-slate-900">{meal.name}</div>
                          <div className="text-[11px] text-slate-500">{meal.cuisine} · {meal.neighborhood}</div>
                          <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-100">
                            <span className="font-bold text-indigo-600">Must Try:</span> {meal.must_try}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transit & Logistics advice */}
                {day.transportation_advice && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
                    <Bus className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Transportation & Route Strategy: </span>
                      <span>{day.transportation_advice}</span>
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 2: ROUTE MAP */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Geographic Route Clustering</h3>
              <p className="text-xs text-slate-500">
                Markers reflect morning (amber), afternoon (blue), and evening (purple) stops.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedDayNumber(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${selectedDayNumber === null ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                All Days
              </button>
              {dailyPlans.map(d => (
                <button
                  key={d.day_number}
                  onClick={() => setSelectedDayNumber(d.day_number)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${selectedDayNumber === d.day_number ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  Day {d.day_number}
                </button>
              ))}
            </div>
          </div>

          <InteractiveMap activities={mapActivities} selectedDayNumber={selectedDayNumber} />

          {/* Route notes */}
          {itinerary.route_optimization_notes && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
              <Compass className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">Route Optimization Engine: </span>
                <span>{itinerary.route_optimization_notes}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BUDGET BREAKDOWN */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Trip Budget</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ${trip.budget_amount} {trip.currency}
              </div>
              <span className="text-xs font-semibold text-indigo-600 capitalize">{trip.budget_tier} Tier</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated Total Cost</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                ${costBreakdown.total_estimated || 0} {trip.currency}
              </div>
              <span className="text-xs font-semibold text-slate-500">
                ~${Math.round((costBreakdown.total_estimated || 0) / trip.duration_days)} / day
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Contingency Buffer</span>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                ${costBreakdown.buffer_contingency || 0} {trip.currency}
              </div>
              <span className="text-xs font-semibold text-slate-500">Emergency & unexpected buffer</span>
            </div>
          </div>

          {/* Categories Progress Breakdown */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900">Expense Allocation by Category</h3>
            
            <div className="space-y-4 text-xs">
              {[
                { label: 'Accommodations', amount: costBreakdown.accommodations || 0, color: 'bg-indigo-600', text: 'text-indigo-600' },
                { label: 'Food & Dining', amount: costBreakdown.food_and_dining || 0, color: 'bg-emerald-600', text: 'text-emerald-600' },
                { label: 'Activities & Attractions', amount: costBreakdown.activities || 0, color: 'bg-amber-500', text: 'text-amber-600' },
                { label: 'Transportation & Transit', amount: costBreakdown.transportation || 0, color: 'bg-sky-500', text: 'text-sky-600' },
                { label: 'Emergency Buffer', amount: costBreakdown.buffer_contingency || 0, color: 'bg-purple-500', text: 'text-purple-600' },
              ].map((cat) => {
                const total = costBreakdown.total_estimated || trip.budget_amount || 1;
                const percent = Math.min(100, Math.round((cat.amount / total) * 100));
                return (
                  <div key={cat.label} className="space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{cat.label}</span>
                      <span className={cat.text}>${cat.amount} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`${cat.color} h-2.5 rounded-full`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACCOMMODATIONS */}
      {activeTab === 'stays' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accommodations.map((stay, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">
                      {stay.type}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{stay.name}</h3>
                    <p className="text-xs text-slate-500">{stay.neighborhood}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900">${stay.price_per_night}</div>
                    <span className="text-[10px] text-slate-400 font-semibold">per night</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {stay.why_recommended}
                </p>

                {stay.amenities && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {stay.amenities.map((am, aIdx) => (
                      <span key={aIdx} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        ✓ {am}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PACKING & LOCAL ADVICE */}
      {activeTab === 'packing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Packing Checklist */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Interactive Packing Checklist</h3>
            </div>

            <div className="space-y-5">
              {packingChecklist.map((cat, cIdx) => (
                <div key={cIdx} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{cat.category}</h4>
                  <div className="space-y-1.5">
                    {cat.items.map((item, iIdx) => {
                      const key = `${cIdx}-${iIdx}`;
                      const isDone = !!checkedItems[key];
                      return (
                        <div
                          key={iIdx}
                          onClick={() => togglePackingItem(key)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer text-xs font-medium transition-colors ${
                            isDone ? 'bg-emerald-50 text-emerald-800 line-through' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isDone ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Local Insider Advice */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Local Secrets & Etiquette</h3>
            </div>

            <div className="space-y-3">
              {localTips.map((tip, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <span className="font-bold text-amber-800">Pro-Tip #{idx + 1}:</span>
                  <p className="leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Modals */}
      <AddActivityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        dayNumber={selectedDayNumber || 1}
        onAdd={handleAddCustomActivity}
      />

      <RegenerateDayModal
        isOpen={showRegenModal}
        onClose={() => setShowRegenModal(false)}
        dayNumber={selectedDayNumber || 1}
        onRegenerate={onRegenerateDay}
        isRegenerating={isRegenerating}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        trip={trip}
      />

      <EditTripModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        trip={trip}
        onSave={onUpdateTrip}
      />

    </div>
  );
}

