import { useNavigate } from 'react-router-dom';

export default function TripCard({ trip, onDelete }) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const status = trip.end_date < today ? 'completed' : trip.start_date > today ? 'upcoming' : 'ongoing';

  const statusColors = {
    upcoming: 'badge-secondary',
    ongoing: 'badge-success',
    completed: 'badge-primary',
  };

  const gradients = [
    'from-blue-500 to-purple-600',
    'from-primary to-orange-500',
    'from-emerald-500 to-teal-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
  ];
  const gradient = gradients[trip.id % gradients.length];

  return (
    <div className="glass-card overflow-hidden group cursor-pointer" onClick={() => navigate(`/trip/${trip.id}/build`)}>
      {/* Cover */}
      <div className={`h-36 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
        <div className="absolute top-3 right-3">
          <span className={`badge ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div className="absolute bottom-3 left-4">
          <h3 className="text-xl font-bold text-white drop-shadow-lg">{trip.name}</h3>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">📅 {trip.start_date}</span>
          <span>→</span>
          <span>{trip.end_date}</span>
        </div>

        {trip.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{trip.description}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">📍 {trip.stop_count || 0} stops</span>
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/trip/${trip.id}/view`); }}
              className="btn-ghost text-xs px-3 py-1.5"
            >👁️ View</button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/trip/${trip.id}/build`); }}
              className="btn-ghost text-xs px-3 py-1.5"
            >✏️ Edit</button>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(trip.id); }}
                className="btn-ghost text-xs px-3 py-1.5 text-danger hover:bg-danger/10"
              >🗑️</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
