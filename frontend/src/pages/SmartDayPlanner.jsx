import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axios';

export default function SmartDayPlanner() {
  const { tripId, date } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dayPlan, setDayPlan] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optResult, setOptResult] = useState(null);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [cityResults, setCityResults] = useState([]);

  const fetchOrCreateDayPlan = async () => {
    try {
      // Try to get existing day plans
      const res = await API.get(`/trips/${tripId}/day-plans`);
      let plan = res.data.find(dp => dp.plan_date === date);
      if (!plan) {
        const createRes = await API.post(`/trips/${tripId}/day-plans`, { plan_date: date, label: '' });
        plan = createRes.data;
      }
      setDayPlan(plan);
      setSlots(plan.slots || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchOrCreateDayPlan(); }, [tripId, date]);

  // Search cities for adding slot
  useEffect(() => {
    if (!citySearch) { setCityResults([]); return; }
    const t = setTimeout(() => {
      API.get(`/cities?search=${citySearch}`).then(r => setCityResults(r.data)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [citySearch]);

  const addSlot = async (city) => {
    if (!dayPlan) return;
    await API.post(`/day-plans/${dayPlan.id}/slots`, {
      city: city.name, country: city.country,
      latitude: city.latitude, longitude: city.longitude,
      slot_order: slots.length,
    });
    setCitySearch('');
    setCityResults([]);
    setShowAddSlot(false);
    fetchOrCreateDayPlan();
  };

  const removeSlot = async (slotId) => {
    await API.delete(`/slots/${slotId}`);
    fetchOrCreateDayPlan();
  };

  const runOptimization = async () => {
    setOptimizing(true);
    try {
      const payload = {
        trip_description: '',
        date: date,
        slots: slots.map(s => ({
          city: s.city, country: s.country,
          latitude: s.latitude || 0, longitude: s.longitude || 0,
          activities: s.activities?.map(a => ({ name: a.activity_name, duration_minutes: a.duration_minutes })) || [],
          preferred_time: 'any',
        }))
      };
      const res = await API.post('/ai/optimize-day', payload);
      setOptResult(res.data);
    } catch { /* ignore */ }
    setOptimizing(false);
  };

  const applyOptimization = async () => {
    if (!optResult || !dayPlan) return;
    await API.post(`/day-plans/${dayPlan.id}/apply-optimization`, {
      ordered_slots: optResult.ordered_slots.map((s, i) => ({
        slot_id: slots[i]?.id,
        suggested_arrival: s.suggested_arrival,
        suggested_departure: s.suggested_departure,
        travel_time_from_prev_minutes: optResult.travel_times?.[i - 1] || 0,
        is_overloaded: optResult.is_overloaded,
      }))
    });
    setOptResult(null);
    fetchOrCreateDayPlan();
  };

  // Day load meter
  const totalMinutes = slots.reduce((acc, slot) => {
    const activityMins = (slot.activities || []).reduce((a, act) => a + act.duration_minutes, 0);
    return acc + activityMins + (slot.travel_time_from_prev_minutes || 0);
  }, 0);
  const loadPercent = Math.min((totalMinutes / (14 * 60)) * 100, 100);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="skeleton h-40 rounded-2xl mb-4" />
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark">🧠 Smart Day Planner</h1>
          <p className="text-gray-500 mt-1">
            {new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => navigate(`/trip/${tripId}/build`)} className="btn-ghost">← Back to Trip</button>
      </div>

      {/* Day Load Meter */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Day Load</span>
          <span className={`text-sm font-bold ${loadPercent > 85 ? 'text-danger' : loadPercent > 60 ? 'text-amber-500' : 'text-success'}`}>
            {Math.round(totalMinutes / 60)}h / 14h ({Math.round(loadPercent)}%)
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${loadPercent > 85 ? 'bg-danger' : loadPercent > 60 ? 'bg-amber-400' : 'bg-success'}`}
            style={{ width: `${loadPercent}%` }}
          />
        </div>
      </div>

      {/* AI Optimization Result */}
      {optResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 animate-fade-in">
          <h3 className="font-bold text-amber-800 mb-2">AI Optimization Result</h3>
          <p className="text-sm text-amber-700 mb-3">{optResult.summary}</p>
          {optResult.warnings?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {optResult.warnings.map((w, i) => (
                <span key={i} className="bg-danger/10 text-danger text-xs px-3 py-1 rounded-full">{w}</span>
              ))}
            </div>
          )}
          <div className="space-y-2 mb-4">
            {optResult.ordered_slots?.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-xs bg-white px-2 py-1 rounded">{s.suggested_arrival} - {s.suggested_departure}</span>
                <span className="font-medium text-dark">{s.city}</span>
                <span className="text-xs text-gray-400">{s.reason}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={applyOptimization} className="btn-primary text-sm">Apply This Plan</button>
            <button onClick={() => setOptResult(null)} className="btn-ghost text-sm">Dismiss</button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setShowAddSlot(true)} className="btn-outline text-sm">+ Add City Slot</button>
        {slots.length >= 2 && (
          <button onClick={runOptimization} disabled={optimizing} className="btn-primary text-sm">
            {optimizing ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Optimizing...
              </span>
            ) : 'Run AI Optimization'}
          </button>
        )}
      </div>

      {/* Add Slot Search */}
      {showAddSlot && (
        <div className="glass-card p-5 mb-6 animate-fade-in border-l-4 border-primary">
          <h3 className="font-bold text-dark mb-3">Search City to Add</h3>
          <input
            type="text" className="input-field mb-3" placeholder="Search cities..."
            value={citySearch} onChange={(e) => setCitySearch(e.target.value)} autoFocus
          />
          <div className="max-h-48 overflow-y-auto space-y-2">
            {cityResults.map(city => (
              <div key={city.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="font-medium text-dark">{city.name}</span>
                  <span className="text-sm text-gray-400 ml-2">{city.country}</span>
                </div>
                <button onClick={() => addSlot(city)} className="btn-primary text-xs">Add</button>
              </div>
            ))}
          </div>
          <button onClick={() => { setShowAddSlot(false); setCitySearch(''); }} className="btn-ghost text-sm mt-3">Cancel</button>
        </div>
      )}

      {/* Slots Timeline */}
      <div className="space-y-3">
        {slots.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <p className="text-5xl mb-3">🗓️</p>
            <p className="text-gray-500">No slots yet. Add cities to plan this day!</p>
          </div>
        ) : (
          slots.map((slot, idx) => (
            <div key={slot.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-dark">{slot.city}, {slot.country}</h3>
                    <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                      {slot.arrival_time && <span>Arrive: {slot.arrival_time}</span>}
                      {slot.departure_time && <span>Depart: {slot.departure_time}</span>}
                      {slot.travel_time_from_prev_minutes > 0 && (
                        <span className={`px-2 py-0.5 rounded-full ${
                          slot.travel_time_from_prev_minutes < 60 ? 'bg-green-100 text-green-700'
                          : slot.travel_time_from_prev_minutes < 120 ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>{slot.travel_time_from_prev_minutes}min travel</span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => removeSlot(slot.id)} className="btn-ghost text-xs text-danger">Remove</button>
              </div>

              {/* Activities in slot */}
              {slot.activities?.length > 0 && (
                <div className="ml-13 space-y-1 mt-2">
                  {slot.activities.map(act => (
                    <div key={act.id} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {act.activity_name} <span className="text-xs text-gray-400">({act.duration_minutes}min · ${act.cost})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
