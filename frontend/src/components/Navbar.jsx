import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
              T
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              TravelLoop
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
              { to: '/my-trips', label: 'My Trips', icon: '✈️' },
              { to: '/cities', label: 'Explore', icon: '🌍' },
              { to: '/profile', label: 'Profile', icon: '👤' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'bg-primary/10 text-primary-dark'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-dark'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {user.is_admin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive('/admin')
                    ? 'bg-secondary/10 text-secondary-dark'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-dark'
                }`}
              >
                <span>⚙️</span> Admin
              </Link>
            )}
            <button onClick={handleLogout} className="ml-3 btn-ghost text-sm text-gray-500 hover:text-danger">
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {[
                { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
                { to: '/my-trips', label: 'My Trips', icon: '✈️' },
                { to: '/cities', label: 'Explore', icon: '🌍' },
                { to: '/profile', label: 'Profile', icon: '👤' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive(link.to) ? 'bg-primary/10 text-primary-dark' : 'text-gray-600'
                  }`}
                >
                  <span>{link.icon}</span> {link.label}
                </Link>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 font-medium">
                🚪 Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
