import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import API from '../api/axios';

export default function CitySearch() {
  const { tripId } = useParams();
  const [searchParams] = useSearchParams();
  const urlTripId = tripId || searchParams.get('tripId');

  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const regions = ['Europe', 'Asia', 'North America', 'Middle East', 'Africa'];

  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (region) params.region = region;
      const res = await API.get('/cities', { params });
      setCities(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [search, region]);

  useEffect(() => {
    const debounce = setTimeout(fetchCities, 300);
    return () => clearTimeout(debounce);
  }, [fetchCities]);

  const addToTrip = async (city) => {
    if (!urlTripId) {
      setToast('Navigate from a trip to add stops');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    try {
      await API.post(`/trips/${urlTripId}/stops`, {
        city: city.name, country: city.country, order_index: 0
      });
      setToast(`${city.name} added to trip!`);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err.response?.data?.detail || 'Failed to add');
      setTimeout(() => setToast(''), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-dark mb-2">🌍 Explore Destinations</h1>
      <p className="text-gray-500 mb-6">Discover cities worldwide and add them to your trip</p>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-success text-white px-6 py-3 rounded-xl shadow-xl animate-fade-in z-50">
          {toast}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text" placeholder="Search cities, countries..."
          className="input-field flex-1" value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input-field w-full sm:w-48" value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="">All Regions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Cities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
        </div>
      ) : cities.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-5xl mb-3">🏙️</p>
          <p className="text-gray-500">No cities found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cities.map(city => (
            <div key={city.id} className="glass-card overflow-hidden group">
              <div className="h-32 bg-gradient-to-br from-secondary/60 to-primary/60 relative">
                <div className="absolute bottom-3 left-4">
                  <h3 className="text-lg font-bold text-white">{city.name}</h3>
                  <p className="text-sm text-white/80">{city.country} · {city.region}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{city.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>⭐ {city.popularity_score}</span>
                    <span>💰 Cost: {city.cost_index}</span>
                  </div>
                  {urlTripId && (
                    <button
                      onClick={() => addToTrip(city)}
                      className="btn-primary text-xs px-4"
                    >+ Add to Trip</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
