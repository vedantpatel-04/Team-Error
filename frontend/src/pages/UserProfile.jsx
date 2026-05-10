import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [favourites, setFavourites] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      API.get('/users/me'),
      API.get('/users/me/favourites').catch(() => ({ data: [] })),
    ]).then(([profileRes, favsRes]) => {
      setProfile(profileRes.data);
      setForm({ name: profileRes.data.name, phone: profileRes.data.phone || '', city: profileRes.data.city || '', country: profileRes.data.country || '', language: profileRes.data.language || 'en' });
      setFavourites(favsRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.put('/users/me', form);
      setProfile(res.data);
      setMessage('Profile updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Failed to save'); }
    setSaving(false);
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await API.post('/users/me/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile({ ...profile, profile_photo: res.data.profile_photo });
    } catch { /* ignore */ }
  };

  const removeFavourite = async (cityId) => {
    await API.delete(`/users/me/favourites/${cityId}`);
    setFavourites(favourites.filter(f => f.city_id !== cityId));
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    await API.delete('/users/me');
    localStorage.removeItem('token');
    logout();
    navigate('/login');
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dark mb-6">👤 My Profile</h1>

      {message && (
        <div className="bg-success/10 text-success px-5 py-3 rounded-xl mb-6 font-medium animate-fade-in">{message}</div>
      )}

      {/* Avatar */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            {profile?.profile_photo ? (
              <img src={`http://localhost:8000${profile.profile_photo}`} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-primary/30" />
            ) : (
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                {profile?.name?.charAt(0) || '?'}
              </div>
            )}
            <label className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              <span className="text-white text-xs">📷</span>
              <input type="file" className="hidden" accept="image/*" onChange={uploadPhoto} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark">{profile?.name}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <p className="text-xs text-gray-400 mt-1">Joined {new Date(profile?.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="glass-card p-6 mb-6">
        <h3 className="font-bold text-dark mb-4">Edit Profile</h3>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input type="text" className="input-field" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input type="text" className="input-field" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Language</label>
              <select className="input-field" value={form.language || 'en'} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
              <input type="text" className="input-field" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
              <input type="text" className="input-field" value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Favourites */}
      {favourites.length > 0 && (
        <div className="glass-card p-6 mb-6">
          <h3 className="font-bold text-dark mb-3">❤️ Favourite Cities</h3>
          <div className="space-y-2">
            {favourites.map(f => (
              <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-dark">City #{f.city_id}</span>
                <button onClick={() => removeFavourite(f.city_id)} className="btn-ghost text-xs text-danger">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="glass-card p-6 border-2 border-danger/20">
        <h3 className="font-bold text-danger mb-2">⚠️ Danger Zone</h3>
        <p className="text-sm text-gray-500 mb-4">Permanently delete your account and all data.</p>
        <button onClick={deleteAccount} className="bg-danger text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-danger/90 transition-colors">
          Delete My Account
        </button>
      </div>
    </div>
  );
}
