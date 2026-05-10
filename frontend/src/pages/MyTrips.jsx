import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import TripCard from '../components/TripCard';

export default function MyTrips() {
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTrips = async () => {
    try {
      const res = await API.get('/trips');
      setTrips(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchTrips(); }, []);

  const deleteTrip = async (id) => {
    if (!confirm('Delete this trip?')) return;
    await API.delete(`/trips/${id}`);
    setTrips(trips.filter(t => t.id !== id));
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = trips.filter(trip => {
    if (activeTab === 'upcoming') return trip.start_date > today;
    if (activeTab === 'ongoing') return trip.start_date <= today && trip.end_date >= today;
    if (activeTab === 'completed') return trip.end_date < today;
    return true;
  });

  const tabs = ['all', 'upcoming', 'ongoing', 'completed'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark">🧳 My Trips</h1>
          <p className="text-gray-500 mt-1">{trips.length} trips total</p>
        </div>
        <button onClick={() => navigate('/trips/new')} className="btn-primary">+ New Trip</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >{tab}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-5xl mb-3">✈️</p>
          <p className="text-gray-500">{activeTab === 'all' ? 'No trips yet' : `No ${activeTab} trips`}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(trip => (
            <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
          ))}
        </div>
      )}
    </div>
  );
}
