import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TripCard from './components/TripCard';
import TripWizardModal from './components/TripWizardModal';
import ItineraryView from './components/ItineraryView';
import SystemStatusModal from './components/SystemStatusModal';
import EditTripModal from './components/EditTripModal';
import { api } from './services/api';
import { 
  Plus, Search, Compass, Sparkles, MapPin, Calendar, 
  DollarSign, Heart, Filter, Globe2, Plane, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function App() {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'itinerary'
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Modals
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [styleFilter, setStyleFilter] = useState('all');

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load trips & status on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [tripsData, statusData] = await Promise.all([
        api.getTrips().catch(() => []),
        api.getStatus().catch(() => null),
      ]);
      setTrips(tripsData);
      setSystemStatus(statusData);
    } catch (err) {
      console.error(err);
      showToast('Could not reach backend API. Is FastAPI running on port 8000?', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtered trips
  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          trip.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorite = favoriteOnly ? trip.is_favorite : true;
    const matchesStyle = styleFilter === 'all' ? true : trip.travel_style === styleFilter;
    return matchesSearch && matchesFavorite && matchesStyle;
  });

  // Trip selection
  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    setActiveView('itinerary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Favorite toggle
  const handleToggleFavorite = async (trip) => {
    try {
      const updated = await api.updateTrip(trip.id, { is_favorite: !trip.is_favorite });
      setTrips(prev => prev.map(t => t.id === trip.id ? updated : t));
      if (selectedTrip?.id === trip.id) setSelectedTrip(updated);
      showToast(updated.is_favorite ? 'Added to favorites!' : 'Removed from favorites.');
    } catch (err) {
      showToast('Failed to update favorite status', 'error');
    }
  };

  // Delete trip
  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip itinerary?')) return;
    try {
      await api.deleteTrip(tripId);
      setTrips(prev => prev.filter(t => t.id !== tripId));
      if (selectedTrip?.id === tripId) {
        setSelectedTrip(null);
        setActiveView('dashboard');
      }
      showToast('Trip itinerary deleted.');
    } catch (err) {
      showToast('Failed to delete trip', 'error');
    }
  };

  // Update trip
  const handleUpdateTrip = async (tripId, updates) => {
    try {
      const updated = await api.updateTrip(tripId, updates);
      setTrips(prev => prev.map(t => t.id === tripId ? updated : t));
      if (selectedTrip?.id === tripId) setSelectedTrip(updated);
      showToast('Trip updated successfully!');
    } catch (err) {
      showToast('Failed to save trip updates', 'error');
    }
  };

  // Regenerate single day
  const handleRegenerateDay = async (dayNumber, instructions, focusInterests) => {
    if (!selectedTrip) return;
    try {
      setIsRegenerating(true);
      const updated = await api.regenerateDay(selectedTrip.id, dayNumber, instructions, focusInterests);
      setSelectedTrip(updated);
      setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
      showToast(`Day ${dayNumber} successfully regenerated with AI!`);
    } catch (err) {
      showToast('Failed to regenerate day. Please try again.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Regenerate all
  const handleRegenerateAll = async (tripId) => {
    try {
      setIsRegenerating(true);
      const updated = await api.regenerateAll(tripId);
      setSelectedTrip(updated);
      setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
      showToast('Full itinerary regenerated with AI!');
    } catch (err) {
      showToast('Failed to regenerate full trip', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Wizard success
  const handleWizardSuccess = (newTrip) => {
    setTrips(prev => [newTrip, ...prev]);
    setSelectedTrip(newTrip);
    setActiveView('itinerary');
    setShowWizardModal(false);
    showToast(`Itinerary for ${newTrip.destination} created!`);
  };

  // Quick stats
  const totalDestinations = new Set(trips.map(t => t.destination)).size;
  const totalDays = trips.reduce((acc, t) => acc + (t.duration_days || 1), 0);
  const totalBudget = trips.reduce((acc, t) => acc + Number(t.budget_amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 flex flex-col font-sans">
      
      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl bg-slate-900 text-white text-xs font-semibold animate-slide-up">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        onOpenNewTrip={() => setShowWizardModal(true)}
        onOpenStatus={() => setShowStatusModal(true)}
        systemStatus={systemStatus}
        activeView={activeView}
        setActiveView={setActiveView}
        selectedTrip={selectedTrip}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {activeView === 'itinerary' && selectedTrip ? (
          <ItineraryView
            trip={selectedTrip}
            onBack={() => setActiveView('dashboard')}
            onUpdateTrip={handleUpdateTrip}
            onRegenerateDay={handleRegenerateDay}
            onRegenerateAll={handleRegenerateAll}
            isRegenerating={isRegenerating}
          />
        ) : (
          /* DASHBOARD VIEW */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Hero Dashboard Banner */}
            <div className="relative rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-sky-600 p-8 sm:p-10 text-white overflow-hidden shadow-xl">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI-Powered Travel Intelligence</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Personalized travel plans engineered in seconds.
                </h1>

                <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
                  Enter your destination, dates, budget, group size, and vibe. Let generative AI build geographically optimized daily itineraries, dining recommendations, and budget plans.
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setShowWizardModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold shadow-lg shadow-black/10 transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Plan Your Next Trip</span>
                  </button>
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-900/60 text-white text-xs font-bold border border-white/20 transition-all"
                  >
                    <Globe2 className="w-4 h-4" />
                    <span>Integration Status</span>
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/20 text-xs">
                <div>
                  <span className="text-indigo-200 text-[11px] block">Trips Created</span>
                  <span className="text-xl font-black text-white">{trips.length}</span>
                </div>
                <div>
                  <span className="text-indigo-200 text-[11px] block">Destinations</span>
                  <span className="text-xl font-black text-white">{totalDestinations}</span>
                </div>
                <div>
                  <span className="text-indigo-200 text-[11px] block">Days Planned</span>
                  <span className="text-xl font-black text-white">{totalDays}</span>
                </div>
                <div>
                  <span className="text-indigo-200 text-[11px] block">Budget Managed</span>
                  <span className="text-xl font-black text-white">${totalBudget.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              
              {/* Search box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by destination or title..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setFavoriteOnly(!favoriteOnly)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    favoriteOnly
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-current text-rose-500' : ''}`} />
                  <span>Favorites</span>
                </button>

                <select
                  value={styleFilter}
                  onChange={(e) => setStyleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                >
                  <option value="all">All Travel Styles</option>
                  <option value="culture">Culture & History</option>
                  <option value="foodie">Foodie & Culinary</option>
                  <option value="adventure">Adventure</option>
                  <option value="relaxed">Relaxed</option>
                  <option value="balanced">Balanced</option>
                  <option value="romantic">Romantic</option>
                </select>
              </div>

            </div>

            {/* Trips Grid */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Compass className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                <p className="text-xs font-bold text-slate-600">Loading your travel itineraries...</p>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="py-16 px-4 bg-white rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                  <Plane className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No Itineraries Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mb-5">
                  {searchQuery || favoriteOnly || styleFilter !== 'all'
                    ? 'No trips matched your current filters. Try resetting search filters or create a new trip.'
                    : 'You haven’t planned any trips yet. Generate your first personalized itinerary with AI!'}
                </p>
                <button
                  onClick={() => setShowWizardModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Plan Your First Trip</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onSelect={handleSelectTrip}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={(t) => setEditingTrip(t)}
                    onDelete={handleDeleteTrip}
                  />
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Wanderlust AI</span>
            <span>• Full-Stack Travel Planner (React + FastAPI + Supabase)</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowStatusModal(true)} className="hover:text-indigo-600 font-medium">
              System Health & Config
            </button>
            <span>•</span>
            <span>Local & Supabase Hybrid Storage</span>
          </div>
        </div>
      </footer>

      {/* Trip Wizard Modal */}
      <TripWizardModal
        isOpen={showWizardModal}
        onClose={() => setShowWizardModal(false)}
        onSuccess={handleWizardSuccess}
      />

      {/* System Status Modal */}
      <SystemStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        systemStatus={systemStatus}
      />

      {/* Edit Trip Modal */}
      {editingTrip && (
        <EditTripModal
          isOpen={true}
          onClose={() => setEditingTrip(null)}
          trip={editingTrip}
          onSave={handleUpdateTrip}
        />
      )}

    </div>
  );
}
