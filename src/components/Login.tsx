import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import Constants from "../Constants";
import loginImage from "../assets/images/loginPlant.jpg";
import logo from "/src/assets/images/logo.png";
import { Link } from "react-router-dom";

interface LoginProps {
  setLoggedInUser: (user: string | null) => void;
}

const Login = ({ setLoggedInUser }: LoginProps) => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('BASE_URL: '+Constants.BASE_URL);
    try {
      const response = await axios.post(Constants.BASE_URL + "/Auth/Login", {
        userName,
        password,
      });
      console.log(response.data);
      setLoggedInUser(userName);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-form">
          <p className="login-eyebrow">Smart Motor Control</p>
          <h2>Welcome to Pijeen</h2>
          <p className="login-subtitle">
            Sign in to monitor and schedule your devices in real time.
          </p>
          <div className="login-logo">
            <img src={logo} alt="Logo" />
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Enter username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
          <p className="redirect-text">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>

        <div className="login-image">
          <img src={loginImage} alt="Plant Monitoring Visual" />
          <div className="login-image-overlay">
            <h3>Connected Operations</h3>
            <p>Secure control panel for 3 Phase and Gate Valve motors.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
