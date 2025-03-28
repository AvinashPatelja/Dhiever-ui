import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './styles.css';

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setLoggedInUser={setLoggedInUser} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={!!loggedInUser}>
              <Dashboard loggedInUser={loggedInUser} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
