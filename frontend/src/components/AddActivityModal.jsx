import React, { useState } from 'react';
import { X, Plus, Clock, DollarSign, MapPin, Tag } from 'lucide-react';

export default function AddActivityModal({ isOpen, onClose, dayNumber, onAdd }) {
  const [timeSlot, setTimeSlot] = useState('morning');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [duration, setDuration] = useState('1.5 hours');
  const [cost, setCost] = useState('0');
  const [tips, setTips] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newActivity = {
      id: `custom-act-${Date.now()}`,
      time_slot: timeSlot,
      title: title.trim(),
      description: description.trim() || 'Custom planned activity.',
      location_name: locationName.trim() || 'City Center',
      estimated_duration: duration,
      estimated_cost: Number(cost) || 0,
      currency: 'USD',
      tags: ['custom', timeSlot],
      tips: tips.trim() || null,
      booking_required: false,
      completed: false,
    };

    onAdd(dayNumber, newActivity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              +
            </div>
            <h3 className="text-sm font-bold text-slate-900">Add Stop to Day {dayNumber}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Time Slot</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['morning', 'afternoon', 'evening', 'night'].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeSlot(slot)}
                  className={`py-1.5 rounded-lg border font-semibold capitalize ${
                    timeSlot === slot
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Activity Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Visit Senso-ji Temple & Street Snack Crawl"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Location / Landmark Name</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Asakusa District"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 2 hours"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Est. Cost ($)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details on what to see or experience..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Insider Tips (Optional)</label>
            <input
              type="text"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder="e.g. Best photo angle from western courtyard"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200"
            >
              Add Activity
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

