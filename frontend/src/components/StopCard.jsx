export default function StopCard({ stop, onEdit, onDelete, onAddActivity, onAISuggest, dragHandleProps }) {
  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 10h2v2H8v-2zm6 0h2v2h-2v-2zm-6 4h2v2H8v-2zm6 0h2v2h-2v-2z"/></svg>
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg text-dark">📍 {stop.city}, {stop.country}</h3>
            <p className="text-sm text-gray-500">
              {stop.arrival_date && stop.departure_date
                ? `${stop.arrival_date} → ${stop.departure_date}`
                : 'Dates not set'}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {onEdit && <button onClick={() => onEdit(stop)} className="btn-ghost text-xs">✏️</button>}
          {onDelete && <button onClick={() => onDelete(stop.id)} className="btn-ghost text-xs text-danger">🗑️</button>}
        </div>
      </div>

      {/* Activities */}
      {stop.activities && stop.activities.length > 0 && (
        <div className="space-y-2 mb-3">
          {stop.activities.map(act => (
            <div key={act.id} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <span>{act.is_selected ? '✅' : '⬜'}</span>
              <span className="flex-1">{act.name}</span>
              <span className="text-gray-400">${act.cost}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {onAddActivity && (
          <button onClick={() => onAddActivity(stop)} className="btn-outline text-xs py-1.5 px-3">
            + Add Activity
          </button>
        )}
        {onAISuggest && (
          <button onClick={() => onAISuggest(stop)} className="btn-secondary text-xs py-1.5 px-3">
            ✨ AI Suggest
          </button>
        )}
      </div>
    </div>
  );
}
