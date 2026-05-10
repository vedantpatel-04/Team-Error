export default function ActivityCard({ activity, onToggle, onRemove, showToggle = true }) {
  const typeIcons = { sightseeing: '🏛️', food: '🍕', adventure: '🏔️', culture: '🎭' };
  const icon = typeIcons[activity.type] || '📌';

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
      activity.is_selected !== false ? 'border-primary/20 bg-primary/5' : 'border-gray-100 bg-gray-50 opacity-60'
    }`}>
      <div className="text-2xl mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-dark">{activity.name}</h4>
        {activity.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{activity.description}</p>}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-gray-500">💰 ${activity.cost || activity.cost_usd || 0}</span>
          <span className="text-xs text-gray-500">⏱️ {activity.duration_minutes}min</span>
          <span className={`badge text-[10px] ${activity.type === 'adventure' ? 'badge-danger' : activity.type === 'food' ? 'badge-warning' : 'badge-secondary'}`}>
            {activity.type}
          </span>
        </div>
      </div>
      <div className="flex gap-1">
        {showToggle && onToggle && (
          <button onClick={() => onToggle(activity)} className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
            activity.is_selected !== false ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'
          }`}>
            {activity.is_selected !== false ? '✓' : '+'}
          </button>
        )}
        {onRemove && (
          <button onClick={() => onRemove(activity)} className="text-xs px-2 py-1 rounded-lg text-danger hover:bg-danger/10 transition-colors">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
