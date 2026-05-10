import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#F5A623', '#2D9CDB', '#27AE60', '#E74C3C', '#9B59B6'];

export default function BudgetBreakdown() {
  const { tripId } = useParams();
  const [budget, setBudget] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ category: 'transport', amount: '', note: '' });
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(200);

  const fetchBudget = async () => {
    try {
      const [summaryRes, tripRes] = await Promise.all([
        API.get(`/trips/${tripId}/budget-summary`),
        API.get(`/trips/${tripId}/budget`),
      ]);
      setBudget(summaryRes.data);
      setItems(tripRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchBudget(); }, [tripId]);

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.amount) return;
    await API.post(`/trips/${tripId}/budget`, { ...form, amount: parseFloat(form.amount) });
    setForm({ category: 'transport', amount: '', note: '' });
    fetchBudget();
  };

  const deleteItem = async (id) => {
    await API.delete(`/budget/${id}`);
    fetchBudget();
  };

  const categories = ['transport', 'stay', 'activities', 'meals'];
  const catIcons = { transport: '🚗', stay: '🏨', activities: '🎯', meals: '🍕' };

  const pieData = budget ? Object.entries(budget.by_category || {}).map(([k, v]) => ({ name: k, value: v })) : [];
  const barData = budget ? Object.entries(budget.by_category || {}).map(([k, v]) => ({ category: k, amount: v })) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dark mb-2">💰 Budget Breakdown</h1>
      <p className="text-gray-500 mb-6">Track and manage your trip expenses</p>

      {/* Over-budget warning */}
      {budget && budget.avg_per_day > threshold && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-5 py-3 rounded-xl mb-6 font-medium">
          ⚠️ Daily average (${budget.avg_per_day.toFixed(0)}) exceeds your ${threshold}/day threshold!
        </div>
      )}

      {/* Summary Cards */}
      {budget && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">${budget.total.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Budget Total</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-secondary">${budget.activity_total.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Activity Costs</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-success">${(budget.total + budget.activity_total).toFixed(0)}</p>
            <p className="text-xs text-gray-500">Grand Total</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-dark">${budget.avg_per_day.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Avg/Day</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-5">
          <h3 className="font-bold text-dark mb-4">By Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-10">No data yet</p>}
        </div>
        <div className="glass-card p-5">
          <h3 className="font-bold text-dark mb-4">Category Breakdown</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-10">No data yet</p>}
        </div>
      </div>

      {/* Daily threshold input */}
      <div className="glass-card p-4 mb-6 flex items-center gap-3">
        <span className="text-sm text-gray-600">Daily budget threshold: $</span>
        <input type="number" className="input-field w-24" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
      </div>

      {/* Add Item */}
      <div className="glass-card p-5 mb-6">
        <h3 className="font-bold text-dark mb-3">Add Expense</h3>
        <form onSubmit={addItem} className="flex flex-wrap gap-3">
          <select className="input-field w-40" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map(c => <option key={c} value={c}>{catIcons[c]} {c}</option>)}
          </select>
          <input type="number" step="0.01" className="input-field w-32" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <input type="text" className="input-field flex-1" placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <button type="submit" className="btn-primary">Add</button>
        </form>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{catIcons[item.category] || '📌'}</span>
              <div>
                <p className="font-medium text-dark capitalize">{item.category}</p>
                <p className="text-xs text-gray-400">{item.note || 'No note'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-dark">${item.amount.toFixed(2)}</span>
              <button onClick={() => deleteItem(item.id)} className="btn-ghost text-xs text-danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
