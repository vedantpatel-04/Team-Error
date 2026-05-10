export default function DayTimeline({ slots, travelTimes = [] }) {
  const getTimeBadge = (time) => {
    if (!time) return { label: '📌', cls: 'badge-primary' };
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return { label: '🌅 Morning', cls: 'badge-warning' };
    if (hour < 17) return { label: '☀️ Afternoon', cls: 'badge-primary' };
    if (hour < 21) return { label: '🌆 Evening', cls: 'badge-secondary' };
    return { label: '🌙 Night', cls: 'badge-success' };
  };

  const getTravelPillClass = (minutes) => {
    if (minutes < 60) return 'travel-pill-green';
    if (minutes <= 120) return 'travel-pill-yellow';
    return 'travel-pill-red';
  };

  if (!slots || slots.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-4">No places added yet</p>;
  }

  return (
    <div className="flex items-stretch gap-0 overflow-x-auto pb-3">
      {slots.map((slot, i) => {
        const badge = getTimeBadge(slot.arrival_time);
        return (
          <div key={slot.id || i} className="flex items-center">
            {/* Slot Card */}
            <div className="flex-shrink-0 w-52 glass-card p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className={`badge ${badge.cls} text-[10px]`}>{badge.label}</span>
                {slot.is_overloaded && <span className="text-xs">⚠️</span>}
              </div>
              <h4 className="font-bold text-sm text-dark">{slot.city}</h4>
              <p className="text-xs text-gray-400">{slot.country}</p>
              {slot.arrival_time && (
                <p className="text-xs text-gray-500 mt-1.5">
                  {slot.arrival_time} – {slot.departure_time || '?'}
                </p>
              )}
              {slot.activities && slot.activities.length > 0 && (
                <div className="mt-2 space-y-1">
                  {slot.activities.map((a, j) => (
                    <div key={j} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                      {a.activity_name || a.name} ({a.duration_minutes}min)
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Travel Time Pill */}
            {i < slots.length - 1 && (
              <div className="flex-shrink-0 px-2 flex flex-col items-center">
                <div className="w-8 border-t-2 border-dashed border-gray-300" />
                <div className={`travel-pill mt-1 ${getTravelPillClass(travelTimes[i] || 0)}`}>
                  🚗 {travelTimes[i] || '?'}m
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
