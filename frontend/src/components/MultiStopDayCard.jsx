import { useNavigate } from 'react-router-dom';
import DayTimeline from './DayTimeline';

export default function MultiStopDayCard({ dayPlan, tripId, travelTimes = [] }) {
  const navigate = useNavigate();
  const slots = dayPlan.slots || [];
  const totalActivities = slots.reduce((sum, s) => sum + (s.activities?.length || 0), 0);

  // Calculate load
  const activityMinutes = slots.reduce((sum, s) =>
    sum + (s.activities?.reduce((a, act) => a + (act.duration_minutes || 60), 0) || 120), 0);
  const travelMinutes = travelTimes.reduce((a, b) => a + b, 0);
  const totalHours = (activityMinutes + travelMinutes) / 60;
  const loadPercent = Math.min((totalHours / 14) * 100, 100);
  const loadColor = loadPercent < 60 ? '#27AE60' : loadPercent < 85 ? '#F39C12' : '#E74C3C';

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-dark flex items-center gap-2">
            📅 {dayPlan.plan_date}
            {dayPlan.label && <span className="text-sm text-gray-400">— {dayPlan.label}</span>}
          </h3>
          <p className="text-xs text-gray-500">{slots.length} places · {totalActivities} activities</p>
        </div>
        <div className="flex items-center gap-3">
          {totalHours > 14 && <span className="badge badge-danger">⚠️ Overloaded</span>}
          <button
            onClick={() => navigate(`/trip/${tripId}/day/${dayPlan.plan_date}/smart-plan`)}
            className="btn-primary text-xs py-1.5 px-3"
          >
            ✨ Smart Plan
          </button>
        </div>
      </div>

      {/* Day Load Meter */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Day Load</span>
          <span>{totalHours.toFixed(1)}h / 14h</span>
        </div>
        <div className="load-meter">
          <div className="load-meter-fill" style={{ width: `${loadPercent}%`, background: loadColor }} />
        </div>
      </div>

      {/* Timeline */}
      <DayTimeline slots={slots} travelTimes={travelTimes} />
    </div>
  );
}
