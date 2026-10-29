import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, Loader2 } from 'lucide-react';

export default function RegenerateDayModal({ isOpen, onClose, dayNumber, onRegenerate, isRegenerating }) {
  const [instructions, setInstructions] = useState('');
  const [focus, setFocus] = useState([]);

  if (!isOpen) return null;

  const presetInterests = ['Foodie & Street Bites', 'Off the Beaten Path', 'Art & Photography', 'Relaxed Pace', 'Historic Heritage'];

  const toggleFocus = (item) => {
    if (focus.includes(item)) {
      setFocus(focus.filter(f => f !== item));
    } else {
      setFocus([...focus, item]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegenerate(dayNumber, instructions, focus);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">AI Regenerate Day {dayNumber}</h3>
          </div>
          <button onClick={onClose} disabled={isRegenerating} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <p className="text-slate-600">
            Tell the AI how you want to alter Day {dayNumber}. You can change the vibe, request specific attractions, or focus on a culinary crawl.
          </p>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Refinement Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Focus more on hidden ramen shops, vintage record stores, and an evening acoustic jazz lounge."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Quick Focus Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presetInterests.map((item) => {
                const isSelected = focus.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleFocus(item)}
                    className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isRegenerating}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRegenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Regenerating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate Day {dayNumber}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

