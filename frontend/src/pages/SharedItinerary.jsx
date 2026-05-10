import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function SharedItinerary() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    API.get(`/trips/public/${tripId}`)
      .then(res => setTrip(res.data))
      .catch(() => setError('This trip is private or does not exist'))
      .finally(() => setLoading(false));
  }, [tripId]);

  const copyTrip = async () => {
    if (!user) {
      navigate(`/login?redirect=/trip/share/${tripId}`);
      return;
    }
    try {
      await API.post(`/trips/${tripId}/copy`);
      navigate('/my-trips');
    } catch { /* ignore */ }
  };

  const shareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );

  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4">🔒</p>
      <h2 className="text-2xl font-bold text-dark mb-2">Trip Not Available</h2>
      <p className="text-gray-500">{error}</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="glass-card overflow-hidden mb-6">
        <div className="h-40 bg-gradient-to-br from-primary/70 to-secondary/70 flex items-end p-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{trip.name}</h1>
            <p className="text-white/80 mt-1">{trip.start_date} → {trip.end_date}</p>
          </div>
        </div>
        <div className="p-6">
          {trip.description && <p className="text-gray-600 mb-4">{trip.description}</p>}
          <div className="flex gap-3 text-sm text-gray-500">
            <span>📍 {trip.stop_count} stops</span>
            <span>📅 {trip.start_date} - {trip.end_date}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={copyTrip} className="btn-primary flex-1">
          📋 {user ? 'Copy This Trip' : 'Login to Copy'}
        </button>
        <button onClick={shareLink} className="btn-outline flex-1">
          {copied ? '✓ Copied!' : '🔗 Share Link'}
        </button>
      </div>
    </div>
  );
}
