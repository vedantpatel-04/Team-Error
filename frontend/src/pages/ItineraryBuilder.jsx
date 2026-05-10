import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function ItineraryBuilder() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [dayPlans, setDayPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddStop, setShowAddStop] = useState(false);
  const [newStop, setNewStop] = useState({ city: '', country: '' });
  const [groupSuggestions, setGroupSuggestions] = useState([]);

  const fetchData = async () => {
    try {
      const [tripRes, stopsRes, dayPlansRes] = await Promise.all([
        API.get(`/trips/${tripId}`),
        API.get(`/trips/${tripId}/stops`),
        API.get(`/trips/${tripId}/day-plans`).catch(() => ({ data: [] })),
      ]);
      setTrip(tripRes.data);
      setStops(stopsRes.data);
      setDayPlans(dayPlansRes.data);

      // Try nearby grouping
      if (stopsRes.data.length >= 2) {
        API.post(`/ai/suggest-nearby-grouping?trip_id=${tripId}`)
          .then(res => setGroupSuggestions(res.data.suggestions || []))
          .catch(() => {});
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tripId]);

  const addStop = async (e) => {
    e.preventDefault();
    if (!newStop.city || !newStop.country) return;
    await API.post(`/trips/${tripId}/stops`, { ...newStop, order_index: stops.length });
    setNewStop({ city: '', country: '' });
    setShowAddStop(false);
    fetchData();
  };

  const deleteStop = async (stopId) => {
    if (!confirm('Remove this stop?')) return;
    await API.delete(`/trips/${tripId}/stops/${stopId}`);
    fetchData();
  };

  const reorderStops = async (fromIndex, toIndex) => {
    const reordered = [...stops];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setStops(reordered);
    await API.post(`/trips/${tripId}/stops/reorder`, { stop_ids: reordered.map(s => s.id) });
  };

  // Group stops by date
  const getDays = () => {
    if (!trip) return [];
    const days = [];
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayPlan = dayPlans.find(dp => dp.plan_date === dateStr);
      const hasOverloaded = dayPlan?.slots?.some(s => s.is_overloaded);
      days.push({ date: dateStr, dayPlan, hasOverloaded });
    }
    return days;
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="skeleton h-40 rounded-2xl mb-6" />
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  );

  const days = getDays();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Trip Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark">{trip?.name}</h1>
            <p className="text-gray-500 mt-1">{trip?.start_date} → {trip?.end_date} · {stops.length} stops</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/trip/${tripId}/view`)} className="btn-outline text-sm">👁️ View</button>
            <button onClick={() => navigate(`/trip/${tripId}/budget`)} className="btn-outline text-sm">💰 Budget</button>
            <button onClick={() => navigate(`/trip/${tripId}/checklist`)} className="btn-outline text-sm">🎒 Checklist</button>
            <button onClick={() => navigate(`/trip/${tripId}/notes`)} className="btn-outline text-sm">📝 Notes</button>
          </div>
        </div>
      </div>

      {/* Nearby Grouping Suggestions */}
      {groupSuggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 animate-fade-in">
          <h3 className="font-bold text-amber-800 mb-2">Smart Grouping Suggestions</h3>
          {groupSuggestions.map((sg, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <p className="text-sm text-amber-700">{sg.message}</p>
              <button
                onClick={() => navigate(`/trip/${tripId}/day/${trip?.start_date}/smart-plan?cities=${sg.city1},${sg.city2}`)}
                className="btn-primary text-xs"
              >Plan Together</button>
            </div>
          ))}
        </div>
      )}

      {/* Stops List */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dark">📍 Stops</h2>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/trip/${tripId}/cities`)} className="btn-outline text-sm">🌍 Browse Cities</button>
            <button onClick={() => setShowAddStop(true)} className="btn-primary text-sm">+ Add Stop</button>
          </div>
        </div>

        {/* Add Stop Modal */}
        {showAddStop && (
          <div className="glass-card p-5 mb-4 animate-fade-in border-l-4 border-primary">
            <form onSubmit={addStop} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                <input type="text" className="input-field" placeholder="e.g. Paris" value={newStop.city} onChange={(e) => setNewStop({ ...newStop, city: e.target.value })} required />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                <input type="text" className="input-field" placeholder="e.g. France" value={newStop.country} onChange={(e) => setNewStop({ ...newStop, country: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary">Add</button>
              <button type="button" onClick={() => setShowAddStop(false)} className="btn-ghost">Cancel</button>
            </form>
          </div>
        )}

        {stops.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <p className="text-5xl mb-3">🗺️</p>
            <p className="text-gray-500">No stops yet. Add cities to build your itinerary!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stops.map((stop, idx) => (
              <div key={stop.id} className="glass-card p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-dark">{stop.city}, {stop.country}</h3>
                    <p className="text-xs text-gray-400">{stop.activities?.length || 0} activities</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => navigate(`/trip/${tripId}/stop/${stop.id}/activities`)} className="btn-ghost text-xs">🎯 Activities</button>
                  {idx > 0 && <button onClick={() => reorderStops(idx, idx - 1)} className="btn-ghost text-xs">⬆️</button>}
                  {idx < stops.length - 1 && <button onClick={() => reorderStops(idx, idx + 1)} className="btn-ghost text-xs">⬇️</button>}
                  <button onClick={() => deleteStop(stop.id)} className="btn-ghost text-xs text-danger">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Day Timeline */}
      <section>
        <h2 className="text-xl font-bold text-dark mb-4">📅 Day Planner</h2>
        <div className="space-y-2">
          {days.map(day => (
            <div key={day.date} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-400">{new Date(day.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}</p>
                  <p className="text-lg font-bold text-dark">{new Date(day.date + 'T00:00:00').getDate()}</p>
                </div>
                {day.dayPlan ? (
                  <span className="text-sm text-gray-600">{day.dayPlan.slots?.length || 0} slots planned</span>
                ) : (
                  <span className="text-sm text-gray-400">No plan yet</span>
                )}
                {day.hasOverloaded && <span className="text-xs bg-danger/10 text-danger px-2 py-1 rounded-full">Overloaded</span>}
              </div>
              <button
                onClick={() => navigate(`/trip/${tripId}/day/${day.date}/smart-plan`)}
                className="btn-outline text-xs"
              >🧠 Smart Plan</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
