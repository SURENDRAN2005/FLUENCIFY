import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Assessment from './pages/Assessment';

const ProtectedRoute = ({ children }) => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />
        <Route path="/assessment" element={
          <ProtectedRoute>
            <Assessment />
          </ProtectedRoute>
        } />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/practice" element={
            <ProtectedRoute>
              <Practice />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
