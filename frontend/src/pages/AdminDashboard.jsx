import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

const COLORS = ['#F5A623', '#2D9CDB', '#27AE60', '#E74C3C', '#9B59B6'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.is_admin) { navigate('/dashboard'); return; }
    Promise.all([
      API.get('/admin/stats'),
      API.get('/admin/users'),
    ]).then(([statsRes, usersRes]) => {
      setStats(statsRes.data);
      setUsers(usersRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, navigate]);

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;
    await API.delete(`/admin/users/${userId}`);
    setUsers(users.filter(u => u.id !== userId));
  };

  const toggleBan = async (userId) => {
    const res = await API.patch(`/admin/users/${userId}/ban`);
    setUsers(users.map(u => u.id === userId ? { ...u, is_banned: res.data.is_banned } : u));
  };

  if (loading) return <div className="max-w-6xl mx-auto p-8"><div className="skeleton h-96 rounded-2xl" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-dark mb-2">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Platform overview and management</p>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-6 text-center">
            <p className="text-4xl font-bold text-primary">{stats.total_users}</p>
            <p className="text-sm text-gray-500 mt-1">Total Users</p>
          </div>
          <div className="glass-card p-6 text-center">
            <p className="text-4xl font-bold text-secondary">{stats.total_trips}</p>
            <p className="text-sm text-gray-500 mt-1">Total Trips</p>
          </div>
          <div className="glass-card p-6 text-center">
            <p className="text-4xl font-bold text-success">{stats.total_activities}</p>
            <p className="text-sm text-gray-500 mt-1">Total Activities</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <h3 className="font-bold text-dark mb-4">Top 5 Cities</h3>
            {stats.top_cities.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.top_cities}>
                  <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {stats.top_cities.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-10">No data yet</p>}
          </div>
          <div className="glass-card p-6">
            <h3 className="font-bold text-dark mb-4">Trips per Week</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.trips_per_week}>
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#F5A623" strokeWidth={3} dot={{ fill: '#F5A623', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-dark mb-4">User Management</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Joined</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{u.name}</td>
                  <td className="py-3 px-4 text-gray-500">{u.email}</td>
                  <td className="py-3 px-4 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    {u.is_admin ? <span className="badge badge-secondary text-xs">Admin</span>
                    : u.is_banned ? <span className="badge bg-danger/10 text-danger text-xs">Banned</span>
                    : <span className="badge badge-primary text-xs">Active</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {!u.is_admin && (
                        <button onClick={() => toggleBan(u.id)} className="btn-ghost text-xs">
                          {u.is_banned ? 'Unban' : 'Ban'}
                        </button>
                      )}
                      <button onClick={() => deleteUser(u.id)} className="btn-ghost text-xs text-danger">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
