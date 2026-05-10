import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function CreateTrip() {
  const [form, setForm] = useState({
    name: '', description: '', start_date: '', end_date: '', is_public: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.start_date || !form.end_date) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.end_date < form.start_date) {
      setError('End date must be after start date');
      return;
    }
    setLoading(true);
    try {
      const res = await API.post('/trips', form);
      navigate(`/trip/${res.data.id}/build`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark">✈️ Plan a New Trip</h1>
        <p className="text-gray-500 mt-1">Let's build your perfect itinerary</p>
      </div>

      <div className="glass-card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-xl font-medium">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trip Name *</label>
            <input
              type="text" className="input-field" placeholder="e.g. Italy Summer 2026"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              className="input-field resize-none" rows={3} placeholder="What's this trip about?"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date *</label>
              <input
                type="date" className="input-field"
                value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date *</label>
              <input
                type="date" className="input-field"
                value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox" id="is_public" className="w-4 h-4 rounded border-gray-300 accent-primary"
              checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
            />
            <label htmlFor="is_public" className="text-sm text-gray-600">Make this trip public (shareable)</label>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : '🚀 Create Trip'}
          </button>
        </form>
      </div>
    </div>
  );
}
