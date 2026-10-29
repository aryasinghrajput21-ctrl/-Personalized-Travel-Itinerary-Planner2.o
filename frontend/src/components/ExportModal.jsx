import React from 'react';
import { X, Printer, Download, Share2, Check } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, trip }) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !trip) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const dailyPlans = trip.itinerary_data?.daily_plans || [];
    let text = `✈️ TRIP ITINERARY: ${trip.title}\n`;
    text += `📍 Destination: ${trip.destination}\n`;
    text += `📅 Dates: ${trip.start_date} to ${trip.end_date} (${trip.duration_days} Days)\n`;
    text += `💰 Budget: ${trip.budget_tier.toUpperCase()} · $${trip.budget_amount} ${trip.currency}\n\n`;

    dailyPlans.forEach(day => {
      text += `--- ${day.theme} (${day.date}) ---\n`;
      text += `Morning: ${day.morning.map(a => a.title).join(', ')}\n`;
      text += `Afternoon: ${day.afternoon.map(a => a.title).join(', ')}\n`;
      text += `Evening: ${day.evening.map(a => a.title).join(', ')}\n`;
      text += `Dining: ${day.meals.map(m => `${m.meal_type.toUpperCase()}: ${m.name} (${m.must_try})`).join(' | ')}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Export & Print Travel Itinerary</h3>
            <p className="text-xs text-slate-500 font-medium">{trip.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-900">Ready for offline travel use</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-indigo-700 text-xs font-bold hover:bg-indigo-50 shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Text Summary'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Printable View Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-xl font-black text-slate-900 mb-1">{trip.title}</h1>
            <p className="text-slate-600 text-xs mb-3">{trip.itinerary_data?.trip_summary}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-slate-700">
              <div className="bg-slate-100 p-2 rounded-lg">Destination: {trip.destination}</div>
              <div className="bg-slate-100 p-2 rounded-lg">Dates: {trip.start_date} → {trip.end_date}</div>
              <div className="bg-slate-100 p-2 rounded-lg">Group: {trip.group_type} ({trip.group_size} travelers)</div>
              <div className="bg-slate-100 p-2 rounded-lg">Budget: ${trip.budget_amount} {trip.currency}</div>
            </div>
          </div>

          {/* Days */}
          <div className="space-y-6">
            {(trip.itinerary_data?.daily_plans || []).map((day) => (
              <div key={day.day_number} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-sm text-slate-900">{day.theme}</h4>
                  <span className="text-[11px] font-bold text-indigo-600">{day.date}</span>
                </div>
                <p className="text-slate-600 italic text-[11px]">{day.summary}</p>

                {/* Activities */}
                <div className="space-y-2">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Scheduled Stops:</div>
                  {[...(day.morning || []), ...(day.afternoon || []), ...(day.evening || []), ...(day.night || [])].map((act) => (
                    <div key={act.id} className="flex items-start justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-indigo-600">[{act.time_slot}]</span>
                          <span className="font-bold text-slate-900">{act.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{act.description}</p>
                        {act.tips && <p className="text-[10px] text-amber-700 mt-1 font-medium">💡 Tip: {act.tips}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-800">{act.estimated_duration}</span>
                        <div className="text-[11px] text-slate-500">{act.estimated_cost > 0 ? `$${act.estimated_cost}` : 'Free'}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Meals */}
                {day.meals?.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="font-bold uppercase tracking-wider text-[10px] text-slate-400 mb-1.5">Curated Dining:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {day.meals.map((m, idx) => (
                        <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px]">
                          <span className="font-bold uppercase text-indigo-600 block text-[9px]">{m.meal_type}</span>
                          <span className="font-bold text-slate-900 block">{m.name}</span>
                          <span className="text-slate-500 text-[10px] block">Must try: {m.must_try}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

