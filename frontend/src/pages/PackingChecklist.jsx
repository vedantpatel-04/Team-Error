import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';

export default function PackingChecklist() {
  const { tripId } = useParams();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'other' });
  const [loading, setLoading] = useState(true);

  const categories = ['clothing', 'documents', 'electronics', 'toiletries', 'other'];
  const catIcons = { clothing: '👕', documents: '📄', electronics: '📱', toiletries: '🧴', other: '📦' };

  const fetchItems = async () => {
    try {
      const res = await API.get(`/trips/${tripId}/checklist`);
      setItems(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [tripId]);

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await API.post(`/trips/${tripId}/checklist`, form);
    setForm({ name: '', category: 'other' });
    fetchItems();
  };

  const togglePacked = async (id) => {
    await API.patch(`/checklist/${id}/toggle`);
    fetchItems();
  };

  const deleteItem = async (id) => {
    await API.delete(`/checklist/${id}`);
    fetchItems();
  };

  const resetAll = async () => {
    if (!confirm('Reset all items?')) return;
    await API.delete(`/trips/${tripId}/checklist/reset`);
    fetchItems();
  };

  const packed = items.filter(i => i.is_packed).length;
  const total = items.length;
  const percent = total > 0 ? Math.round((packed / total) * 100) : 0;

  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dark mb-2">🎒 Packing Checklist</h1>
      <p className="text-gray-500 mb-6">Don't forget anything important!</p>

      {/* Progress Bar */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">{packed}/{total} packed</span>
          <span className="text-sm font-bold text-primary">{percent}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Add Item */}
      <div className="glass-card p-5 mb-6">
        <form onSubmit={addItem} className="flex gap-3">
          <input
            type="text" className="input-field flex-1" placeholder="Add item..."
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select className="input-field w-40" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map(c => <option key={c} value={c}>{catIcons[c]} {c}</option>)}
          </select>
          <button type="submit" className="btn-primary">Add</button>
        </form>
      </div>

      {/* Reset */}
      {total > 0 && (
        <div className="flex justify-end mb-4">
          <button onClick={resetAll} className="btn-ghost text-sm text-danger">Reset All</button>
        </div>
      )}

      {/* Items grouped by category */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : total === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-4xl mb-2">🎒</p>
          <p className="text-gray-500">No items yet. Start adding!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(cat => grouped[cat]?.length > 0 && (
            <div key={cat}>
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">{catIcons[cat]} {cat}</h3>
              <div className="space-y-2">
                {grouped[cat].map(item => (
                  <div key={item.id} className="glass-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox" checked={item.is_packed}
                        onChange={() => togglePacked(item.id)}
                        className="w-5 h-5 rounded accent-primary"
                      />
                      <span className={`text-sm ${item.is_packed ? 'line-through text-gray-400' : 'text-dark'}`}>{item.name}</span>
                    </div>
                    <button onClick={() => deleteItem(item.id)} className="btn-ghost text-xs text-danger">×</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
