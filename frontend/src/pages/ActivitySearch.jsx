import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';

export default function ActivitySearch() {
  const { stopId, tripId } = useParams();
  const [activities, setActivities] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [stopInfo, setStopInfo] = useState(null);

  const fetchActivities = async () => {
    try {
      // Load stop info from the stops list
      const res = await API.get(`/trips/${tripId}/stops`);
      const stop = res.data.find(s => s.id === parseInt(stopId));
      if (stop) {
        setStopInfo(stop);
        // Fetch activities for this stop directly
        const actRes = await API.get(`/stops/${stopId}/activities`);
        setActivities(actRes.data || []);
      }

    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchActivities(); }, [stopId, tripId]);

  const addActivity = async (act) => {
    try {
      await API.post(`/stops/${stopId}/activities`, {
        name: act.name,
        type: act.type,
        cost: act.cost_usd || act.cost || 0,
        duration_minutes: act.duration_minutes || 60,
        description: act.description || '',
        is_selected: true,
      });
      setSuggestions(suggestions.filter(s => s.name !== act.name));
      const actRes = await API.get(`/stops/${stopId}/activities`);
      setActivities(actRes.data || []);
    } catch { /* ignore */ }
  };

  const removeActivity = async (id) => {
    await API.delete(`/stops/${stopId}/activities/${id}`);
    const actRes = await API.get(`/stops/${stopId}/activities`);
    setActivities(actRes.data || []);
  };

  const suggestActivities = async () => {
    if (!stopInfo) return;
    setSuggesting(true);
    try {
      const res = await API.post('/ai/suggest-activities', {
        city: stopInfo.city,
        country: stopInfo.country,
        trip_description: '',
        existing_activities: activities.map(a => a.name),
      });
      setSuggestions(res.data);
    } catch { /* ignore */ }
    setSuggesting(false);
  };

  const typeIcons = { sightseeing: '🏛️', food: '🍕', adventure: '⛰️', culture: '🎭' };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dark mb-1">🎯 Activities</h1>
      <p className="text-gray-500 mb-6">{stopInfo ? `${stopInfo.city}, ${stopInfo.country}` : 'Loading...'}</p>

      {/* AI Suggest Button */}
      <button onClick={suggestActivities} disabled={suggesting} className="btn-primary mb-6">
        {suggesting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Getting AI Suggestions...
          </span>
        ) : '✨ Get AI Suggestions'}
      </button>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-dark mb-3">✨ AI Suggestions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((s, i) => (
              <div key={i} className="glass-card p-4 border-l-4 border-primary/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-dark">{typeIcons[s.type] || '📌'} {s.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{s.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>💰 ${s.cost_usd}</span>
                      <span>⏱️ {s.duration_minutes}min</span>
                      <span className="capitalize">{s.type}</span>
                    </div>
                  </div>
                  <button onClick={() => addActivity(s)} className="btn-primary text-xs px-3">+ Add</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Current Activities */}
      <section>
        <h2 className="text-lg font-bold text-dark mb-3">📋 Added Activities ({activities.length})</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
        ) : activities.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-4xl mb-2">🎯</p>
            <p className="text-gray-500">No activities yet. Use AI to get suggestions!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map(act => (
              <div key={act.id} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-dark">{typeIcons[act.type] || '📌'} {act.name}</h3>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span>💰 ${act.cost}</span>
                    <span>⏱️ {act.duration_minutes}min</span>
                  </div>
                </div>
                <button onClick={() => removeActivity(act.id)} className="btn-ghost text-xs text-danger">Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
