import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', city: '', country: '', password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">T</div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-300 mt-2">Start planning your dream trips</p>
        </div>

        <div className="glass-card p-8" style={{ background: 'rgba(255,255,255,0.95)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-xl font-medium">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} className="input-field" placeholder="John" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} className="input-field" placeholder="Doe" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" placeholder="you@example.com" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="+1 234 567 890" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                <input name="city" value={form.city} onChange={handleChange} className="input-field" placeholder="New York" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                <input name="country" value={form.country} onChange={handleChange} className="input-field" placeholder="USA" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" placeholder="Min. 6 characters" required />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-50">
              {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</span> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:text-primary-dark">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
