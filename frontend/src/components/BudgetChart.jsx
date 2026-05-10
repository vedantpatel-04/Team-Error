import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#F5A623', '#2D9CDB', '#27AE60', '#E74C3C', '#9B59B6', '#1ABC9C'];

export default function BudgetChart({ byCategory, total }) {
  const pieData = Object.entries(byCategory || {}).map(([name, value]) => ({ name, value }));

  if (pieData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-4xl mb-2">💰</p>
        <p>No budget data yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">By Category</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Spending Breakdown</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={pieData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
