import React, { useState, useEffect } from 'react';
import { 
  X, Compass, MapPin, Calendar, Users, DollarSign, Sparkles, 
  Check, ArrowRight, ArrowLeft, Heart, Shield, Coffee, Utensils,
  Camera, Landmark, Footprints, TreePine, Moon, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

const POPULAR_DESTINATIONS = [
  'Tokyo, Japan', 'Paris, France', 'Rome, Italy', 'New York, USA',
  'Barcelona, Spain', 'London, UK', 'Bali, Indonesia', 'Dubai, UAE',
  'Kyoto, Japan', 'Bangkok, Thailand', 'Amsterdam, Netherlands', 'Sydney, Australia'
];

const GROUP_TYPES = [
  { id: 'solo', label: 'Solo Traveler', desc: 'Freedom, reflection & self-paced discoveries', icon: Compass },
  { id: 'couple', label: 'Couple', desc: 'Romantic dinners, scenic strolls & shared moments', icon: Heart },
  { id: 'family', label: 'Family with Kids', desc: 'Comfortable pace, kid-friendly spots & easy transit', icon: Users },
  { id: 'friends', label: 'Group of Friends', desc: 'Vibrant dining, nightlife & social adventures', icon: Users },
];

const TRAVEL_STYLES = [
  { id: 'balanced', label: 'Balanced', desc: 'Blend of sightseeing and leisurely downtime' },
  { id: 'culture', label: 'Culture & History', desc: 'Museums, historic landmarks, architecture & heritage' },
  { id: 'foodie', label: 'Foodie & Culinary', desc: 'Street food, fine dining, tastings & cooking markets' },
  { id: 'relaxed', label: 'Relaxed & Slow', desc: 'Unrushed mornings, cafes, park walks & sunsets' },
  { id: 'adventure', label: 'Adventure & Nature', desc: 'Outdoor thrills, hiking, active exploration & viewpoints' },
  { id: 'romantic', label: 'Romantic & Scenic', desc: 'Panoramic viewpoints, intimate dining & cozy corners' },
  { id: 'fast_paced', label: 'Fast-Paced Explorer', desc: 'Pack as many sights and experiences as possible' },
];

const BUDGET_TIERS = [
  { id: 'budget', label: 'Budget', desc: 'Hostels, local transit, street food', defaultAmount: 800 },
  { id: 'moderate', label: 'Moderate', desc: 'Boutique hotels, mid-tier dining, major tours', defaultAmount: 1800 },
  { id: 'luxury', label: 'Luxury', desc: '5-star resorts, fine dining, private transfers', defaultAmount: 4500 },
  { id: 'custom', label: 'Custom', desc: 'Specify your exact target travel budget', defaultAmount: 2000 },
];

const INTEREST_TAGS = [
  'Historical Monuments', 'Street Food & Night Markets', 'Art Museums',
  'Scenic Viewpoints', 'Boutique Shopping', 'Local Architecture',
  'Coastal Beaches', 'Hiking & Nature', 'Nightlife & Rooftops',
  'Artisanal Coffee & Bakeries', 'Hidden Alleyways', 'Spas & Wellness',
  'Photography Spots', 'Local Cooking Classes'
];

const DIETARY_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-Free', 'Pescatarian'];

export default function TripWizardModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepText, setGenerationStepText] = useState('');
  const [error, setError] = useState(null);

  // Form state
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupType, setGroupType] = useState('couple');
  const [groupSize, setGroupSize] = useState(2);
  const [travelStyle, setTravelStyle] = useState('culture');
  const [budgetTier, setBudgetTier] = useState('moderate');
  const [budgetAmount, setBudgetAmount] = useState(1800);
  const [currency, setCurrency] = useState('USD');
  const [selectedInterests, setSelectedInterests] = useState(['Historical Monuments', 'Artisanal Coffee & Bakeries', 'Street Food & Night Markets']);
  const [dietary, setDietary] = useState(['None']);
  const [specialRequests, setSpecialRequests] = useState('');

  // Default dates to next month
  useEffect(() => {
    if (!startDate) {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setDate(today.getDate() + 14);
      const nextMonthEnd = new Date(nextMonth);
      nextMonthEnd.setDate(nextMonth.getDate() + 4);

      setStartDate(nextMonth.toISOString().split('T')[0]);
      setEndDate(nextMonthEnd.toISOString().split('T')[0]);
    }
  }, [startDate]);

  if (!isOpen) return null;

  // Toggle interest
  const toggleInterest = (tag) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter(t => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  // Toggle dietary
  const toggleDietary = (item) => {
    if (item === 'None') {
      setDietary(['None']);
    } else {
      const withoutNone = dietary.filter(d => d !== 'None');
      if (withoutNone.includes(item)) {
        const next = withoutNone.filter(d => d !== item);
        setDietary(next.length === 0 ? ['None'] : next);
      } else {
        setDietary([...withoutNone, item]);
      }
    }
  };

  const handleBudgetTierChange = (tierId) => {
    setBudgetTier(tierId);
    const tier = BUDGET_TIERS.find(t => t.id === tierId);
    if (tier) {
      setBudgetAmount(tier.defaultAmount);
    }
  };

  // Calculate duration
  const getDurationDays = () => {
    try {
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  };

  const handleSubmit = async () => {
    if (!destination.trim()) {
      setError('Please provide a destination.');
      setStep(1);
      return;
    }

    setIsGenerating(true);
    setError(null);

    const steps = [
      'Scanning destination landmarks and weather patterns...',
      'Synthesizing personalized attractions for your group...',
      'Clustering daily stops to optimize route transit...',
      'Curating authentic dining and accommodation matches...',
      'Finalizing your personalized day-by-day itinerary...'
    ];

    let stepIndex = 0;
    setGenerationStepText(steps[0]);
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setGenerationStepText(steps[stepIndex]);
    }, 1800);

    try {
      const payload = {
        destination: destination.trim(),
        start_date: startDate,
        end_date: endDate,
        budget_tier: budgetTier,
        budget_amount: Number(budgetAmount),
        currency: currency,
        group_size: Number(groupSize),
        group_type: groupType,
        travel_style: travelStyle,
        interests: selectedInterests,
        dietary_preferences: dietary.filter(d => d !== 'None'),
        special_requests: specialRequests.trim() || undefined,
      };

      const newTrip = await api.generateTrip(payload);

      clearInterval(interval);
      setIsGenerating(false);

      // Trigger celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onSuccess(newTrip);
    } catch (err) {
      clearInterval(interval);
      setIsGenerating(false);
      setError(err.message || 'Failed to generate itinerary. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 transition-all">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Itinerary Planner</h2>
              <p className="text-xs text-slate-500 font-medium">
                Step {step} of 3 · {step === 1 ? 'Destination & Dates' : step === 2 ? 'Group & Style' : 'Budget & Preferences'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div 
            className="bg-indigo-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* GENERATING SCREEN */}
          {isGenerating ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 animate-pulse">
                  <Compass className="w-10 h-10 animate-spin-slow" />
                </div>
                <div className="absolute -top-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-full shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Crafting Your Custom Itinerary
              </h3>
              <p className="text-xs text-indigo-600 font-semibold mb-6 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{generationStepText}</span>
              </p>

              <div className="max-w-md w-full bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs text-slate-600 space-y-2">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-400">Destination:</span>
                  <span className="text-slate-800 font-bold">{destination}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-400">Duration:</span>
                  <span className="text-slate-800 font-bold">{getDurationDays()} Days</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-400">Travel Style:</span>
                  <span className="text-slate-800 font-bold capitalize">{travelStyle}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: DESTINATION & DATES */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Where are you traveling? *
                    </label>
                    <div className="relative">
                      <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. Kyoto, Japan or Amalfi Coast, Italy"
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800"
                        autoFocus
                      />
                    </div>

                    {/* Quick Suggestions Chips */}
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Trending Destinations:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_DESTINATIONS.slice(0, 8).map((dest) => (
                          <button
                            key={dest}
                            type="button"
                            onClick={() => setDestination(dest)}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                              destination === dest
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {dest}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Start Date
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        End Date ({getDurationDays()} Days)
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="date"
                          value={endDate}
                          min={startDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: GROUP & TRAVEL STYLE */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Who is traveling?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {GROUP_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = groupType === type.id;
                        return (
                          <div
                            key={type.id}
                            onClick={() => {
                              setGroupType(type.id);
                              if (type.id === 'solo') setGroupSize(1);
                              else if (type.id === 'couple') setGroupSize(2);
                              else if (groupSize < 3) setGroupSize(4);
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/60 border-indigo-600 ring-2 ring-indigo-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                              <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                {type.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{type.desc}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Party size counter */}
                    <div className="flex items-center justify-between mt-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-medium text-slate-700">Total Travelers in Party:</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setGroupSize(Math.max(1, groupSize - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm shadow-2xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-slate-900 w-4 text-center">{groupSize}</span>
                        <button
                          type="button"
                          onClick={() => setGroupSize(Math.min(12, groupSize + 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm shadow-2xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Travel Pace / Style */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Travel Style & Pace
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TRAVEL_STYLES.map((style) => {
                        const isSelected = travelStyle === style.id;
                        return (
                          <div
                            key={style.id}
                            onClick={() => setTravelStyle(style.id)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/60 border-indigo-600 ring-1 ring-indigo-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className={`text-xs font-bold block ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                              {style.label}
                            </span>
                            <span className="text-[10px] text-slate-500 line-clamp-1">{style.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: BUDGET & PREFERENCES */}
              {step === 3 && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {/* Budget Tiers */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Budget Level
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {BUDGET_TIERS.map((tier) => {
                        const isSelected = budgetTier === tier.id;
                        return (
                          <div
                            key={tier.id}
                            onClick={() => handleBudgetTierChange(tier.id)}
                            className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/60 border-indigo-600 ring-2 ring-indigo-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className={`text-xs font-bold block ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                              {tier.label}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{tier.desc}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Budget amount input */}
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          value={budgetAmount}
                          onChange={(e) => setBudgetAmount(Math.max(100, Number(e.target.value)))}
                          placeholder="Estimated Budget"
                          className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="py-1.5 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="AUD">AUD (A$)</option>
                      </select>
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Interests & Highlights (Select all that apply)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {INTEREST_TAGS.map((tag) => {
                        const isSelected = selectedInterests.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleInterest(tag)}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{tag}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dietary Preferences */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Dietary Preferences
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DIETARY_OPTIONS.map((item) => {
                        const isSelected = dietary.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleDietary(item)}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Special Requests / Notes (Optional)
                    </label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="e.g., We celebrate our anniversary on day 2; prefer scenic terraces and avoid crowded tourist buses."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation */}
        {!isGenerating && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !destination.trim()) {
                    setError('Please enter a destination to proceed.');
                    return;
                  }
                  setError(null);
                  setStep(step + 1);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Itinerary with AI</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
