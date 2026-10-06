import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ScanAttendance from './pages/ScanAttendance'; // <-- Import

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/scan" element={<ScanAttendance />} /> {/* <-- Add ScanAttendance */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;