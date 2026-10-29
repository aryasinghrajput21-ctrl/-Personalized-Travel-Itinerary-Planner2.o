import React, { useState } from 'react';
import { X, Save, Edit3, DollarSign, Calendar, MapPin } from 'lucide-react';

export default function EditTripModal({ isOpen, onClose, trip, onSave }) {
  const [title, setTitle] = useState(trip?.title || '');
  const [budgetAmount, setBudgetAmount] = useState(trip?.budget_amount || 1500);
  const [budgetTier, setBudgetTier] = useState(trip?.budget_tier || 'moderate');
  const [travelStyle, setTravelStyle] = useState(trip?.travel_style || 'balanced');

  if (!isOpen || !trip) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(trip.id, {
      title: title.trim(),
      budget_amount: Number(budgetAmount),
      budget_tier: budgetTier,
      travel_style: travelStyle,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Edit Trip Details</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Trip Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Budget ($)</label>
            <input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Budget Tier</label>
              <select
                value={budgetTier}
                onChange={(e) => setBudgetTier(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
              >
                <option value="budget">Budget</option>
                <option value="moderate">Moderate</option>
                <option value="luxury">Luxury</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Travel Style</label>
              <select
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium capitalize"
              >
                <option value="balanced">Balanced</option>
                <option value="culture">Culture</option>
                <option value="foodie">Foodie</option>
                <option value="relaxed">Relaxed</option>
                <option value="adventure">Adventure</option>
                <option value="romantic">Romantic</option>
                <option value="fast_paced">Fast-Paced</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

