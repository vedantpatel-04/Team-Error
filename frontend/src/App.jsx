import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/CreateTrip';
import MyTrips from './pages/MyTrips';
import ItineraryBuilder from './pages/ItineraryBuilder';
import ItineraryView from './pages/ItineraryView';
import CitySearch from './pages/CitySearch';
import ActivitySearch from './pages/ActivitySearch';
import SmartDayPlanner from './pages/SmartDayPlanner';
import BudgetBreakdown from './pages/BudgetBreakdown';
import PackingChecklist from './pages/PackingChecklist';
import SharedItinerary from './pages/SharedItinerary';
import UserProfile from './pages/UserProfile';
import TripNotes from './pages/TripNotes';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/trip/share/:tripId" element={<SharedItinerary />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trips/new" element={<CreateTrip />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/trip/:tripId/build" element={<ItineraryBuilder />} />
          <Route path="/trip/:tripId/view" element={<ItineraryView />} />
          <Route path="/trip/:tripId/cities" element={<CitySearch />} />
          <Route path="/trip/:tripId/stop/:stopId/activities" element={<ActivitySearch />} />
          <Route path="/trip/:tripId/day/:date/smart-plan" element={<SmartDayPlanner />} />
          <Route path="/trip/:tripId/budget" element={<BudgetBreakdown />} />
          <Route path="/trip/:tripId/checklist" element={<PackingChecklist />} />
          <Route path="/trip/:tripId/notes" element={<TripNotes />} />
          <Route path="/cities" element={<CitySearch />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
