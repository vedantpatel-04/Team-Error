import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import TripCard from '../components/TripCard';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentTrips, setRecentTrips] = useState([]);
  const [popularCities, setPopularCities] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/trips').catch(() => ({ data: [] })),
      API.get('/cities/popular').catch(() => ({ data: [] })),
    ]).then(([tripsRes, citiesRes]) => {
      const allTrips = tripsRes.data;
      setRecentTrips(allTrips.slice(0, 3));
      setPopularCities(citiesRes.data);

      // Aggregate budget across trips
      if (allTrips.length > 0) {
        Promise.all(
          allTrips.map(t => API.get(`/trips/${t.id}/budget-summary`).catch(() => ({ data: { total: 0, activity_total: 0 } })))
        ).then(budgets => {
          let total = 0;
          budgets.forEach(b => { total += (b.data.total || 0) + (b.data.activity_total || 0); });
          setBudgetSummary({ total, trip_count: allTrips.length });
        });
      } else {
        setBudgetSummary({ total: 0, trip_count: 0 });
      }
    }).finally(() => setLoading(false));
  }, []);

  const gradients = [
    'from-blue-500/80 to-indigo-600/80',
    'from-rose-500/80 to-pink-600/80',
    'from-emerald-500/80 to-teal-600/80',
    'from-amber-500/80 to-orange-600/80',
    'from-violet-500/80 to-purple-600/80',
    'from-cyan-500/80 to-blue-600/80',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="gradient-hero rounded-3xl p-8 md:p-12 mb-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">✈️</div>
          <div className="absolute bottom-10 right-10 text-8xl">🌍</div>
          <div className="absolute top-20 right-40 text-6xl">🗺️</div>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'Traveler'} 👋
          </h1>
          <p className="text-gray-300 text-lg mb-6">Ready to plan your next adventure?</p>
          <button onClick={() => navigate('/trips/new')} className="btn-primary text-base px-8 py-3">
            ✈️ Plan New Trip
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-primary">{budgetSummary?.trip_count || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total Trips</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-secondary">{popularCities.length}</p>
          <p className="text-sm text-gray-500 mt-1">Destinations</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-success">${budgetSummary?.total?.toFixed(0) || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total Budget</p>
        </div>
      </div>

      {/* Popular Destinations */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-dark">🔥 Popular Destinations</h2>
          <button onClick={() => navigate('/cities')} className="btn-ghost text-sm">View All →</button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularCities.map((city, i) => (
              <div
                key={city.id}
                onClick={() => navigate('/cities')}
                className={`relative h-40 rounded-2xl overflow-hidden cursor-pointer group bg-gradient-to-br ${gradients[i % gradients.length]}`}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-bold text-white text-sm">{city.name}</h3>
                  <p className="text-white/70 text-xs">{city.country}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/70">⭐ {city.popularity_score}</span>
                    <span className="text-[10px] text-white/70">💰 {city.cost_index}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Trips */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-dark">🗓️ Recent Trips</h2>
          <button onClick={() => navigate('/my-trips')} className="btn-ghost text-sm">View All →</button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
          </div>
        ) : recentTrips.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <p className="text-5xl mb-3">🌎</p>
            <p className="text-gray-500 mb-4">No trips yet! Start planning your first adventure.</p>
            <button onClick={() => navigate('/trips/new')} className="btn-primary">Create Your First Trip</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recentTrips.map(trip => <TripCard key={trip.id} trip={trip} />)}
          </div>
        )}
      </section>
    </div>
  );
}
