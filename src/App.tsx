import React, { useState, useMemo, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles.css";
import DeviceRegistration from "./components/DeviceRegistration";

const STORAGE_KEY = "pijeenLoggedInUser";

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const handleSetLoggedInUser = useCallback((user: string | null) => {
    setLoggedInUser(user);
    if (user) {
      localStorage.setItem(STORAGE_KEY, user);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(loggedInUser), [loggedInUser]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setLoggedInUser={handleSetLoggedInUser} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard
                loggedInUser={loggedInUser}
                onLogout={() => handleSetLoggedInUser(null)}
              />
            </ProtectedRoute>
          }
        />
        <Route path="/device-registration" element={<DeviceRegistration />} />
      </Routes>
    </Router>
  );
};

export default App;
