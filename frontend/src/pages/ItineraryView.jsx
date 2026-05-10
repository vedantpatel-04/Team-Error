import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function ItineraryView() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [dayPlans, setDayPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('timeline');

  useEffect(() => {
    Promise.all([
      API.get(`/trips/${tripId}`),
      API.get(`/trips/${tripId}/stops`),
      API.get(`/trips/${tripId}/day-plans`).catch(() => ({ data: [] })),
    ]).then(([tripRes, stopsRes, dpRes]) => {
      setTrip(tripRes.data);
      setStops(stopsRes.data);
      setDayPlans(dpRes.data);
    }).finally(() => setLoading(false));
  }, [tripId]);

  // Calculate total cost
  const totalCost = stops.reduce((acc, stop) => {
    return acc + (stop.activities || [])
      .filter(a => a.is_selected)
      .reduce((a, act) => a + act.cost, 0);
  }, 0);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="skeleton h-40 rounded-2xl mb-6" />
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="glass-card overflow-hidden mb-6">
        <div className="h-40 bg-gradient-to-br from-primary/70 to-secondary/70 flex items-end p-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{trip?.name}</h1>
            <p className="text-white/80 mt-1">{trip?.start_date} → {trip?.end_date} · {stops.length} stops</p>
          </div>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div className="flex gap-2">
            {['timeline', 'list'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${
                  viewMode === mode ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >{mode}</button>
            ))}
          </div>
          <button onClick={() => navigate(`/trip/${tripId}/build`)} className="btn-outline text-sm">✏️ Edit</button>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-1">
          {stops.map((stop, idx) => (
            <div key={stop.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {idx + 1}
                </div>
                {idx < stops.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
              </div>

              {/* Content */}
              <div className="glass-card p-5 flex-1 mb-4">
                <h3 className="text-lg font-bold text-dark">{stop.city}, {stop.country}</h3>
                {stop.arrival_date && (
                  <p className="text-xs text-gray-400 mt-1">{stop.arrival_date} → {stop.departure_date}</p>
                )}
                {(stop.activities || []).length > 0 && (
                  <div className="mt-3 space-y-2">
                    {stop.activities.filter(a => a.is_selected).map(act => (
                      <div key={act.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">• {act.name}</span>
                        <div className="flex gap-3 text-xs text-gray-400">
                          <span>${act.cost}</span>
                          <span>{act.duration_minutes}min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {stops.map((stop, idx) => (
            <div key={stop.id} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{idx + 1}</span>
                <h3 className="font-bold text-dark">{stop.city}, {stop.country}</h3>
              </div>
              {(stop.activities || []).filter(a => a.is_selected).map(act => (
                <p key={act.id} className="text-sm text-gray-600 ml-11">• {act.name} (${act.cost})</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Smart Day Plans */}
      {dayPlans.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-dark mb-4">🧠 Smart Day Plans</h2>
          {dayPlans.map(dp => (
            <div key={dp.id} className="glass-card p-5 mb-4">
              <h3 className="font-bold text-dark mb-3">{dp.plan_date} {dp.label && `— ${dp.label}`}</h3>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {dp.slots?.map((slot, i) => (
                  <div key={slot.id} className="flex items-center gap-2 shrink-0">
                    <div className="bg-secondary/10 px-4 py-2 rounded-xl text-sm">
                      <span className="font-medium text-dark">{slot.city}</span>
                      {slot.arrival_time && <span className="text-xs text-gray-400 ml-2">{slot.arrival_time}-{slot.departure_time}</span>}
                    </div>
                    {i < dp.slots.length - 1 && (
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                        (dp.slots[i + 1]?.travel_time_from_prev_minutes || 0) < 60 ? 'bg-green-100 text-green-700'
                        : (dp.slots[i + 1]?.travel_time_from_prev_minutes || 0) < 120 ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {dp.slots[i + 1]?.travel_time_from_prev_minutes || '?'}min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Total Cost */}
      <div className="glass-card p-5 mt-6 text-center">
        <p className="text-sm text-gray-500">Total Estimated Cost</p>
        <p className="text-3xl font-bold text-primary">${totalCost.toFixed(2)}</p>
      </div>
    </div>
  );
}
