const API_BASE = '/api';

export const api = {
  // Config & Health
  async getStatus() {
    const res = await fetch(`${API_BASE}/trips/config/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  // Trips CRUD
  async getTrips(params = {}) {
    const query = new URLSearchParams();
    if (params.destination) query.append('destination', params.destination);
    if (params.favorite_only) query.append('favorite_only', 'true');
    
    const url = `${API_BASE}/trips${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch trips');
    return res.json();
  },

  async getTrip(id) {
    const res = await fetch(`${API_BASE}/trips/${id}`);
    if (!res.ok) throw new Error('Failed to fetch trip details');
    return res.json();
  },

  async generateTrip(tripData) {
    const res = await fetch(`${API_BASE}/trips/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate trip');
    }
    return res.json();
  },

  async updateTrip(id, updates) {
    const res = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update trip');
    return res.json();
  },

  async deleteTrip(id) {
    const res = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete trip');
    return res.json();
  },

  async regenerateDay(tripId, dayNumber, instructions = '', focusInterests = []) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/regenerate-day`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_number: dayNumber,
        instructions,
        focus_interests: focusInterests,
      }),
    });
    if (!res.ok) throw new Error('Failed to regenerate day');
    return res.json();
  },

  async regenerateAll(tripId) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/regenerate-all`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to regenerate full itinerary');
    return res.json();
  },
};

