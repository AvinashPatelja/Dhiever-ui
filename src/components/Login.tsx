import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import Constants from "../Constants";
import loginImage from "../assets/images/loginPlant.jpg";
import logo from "/src/assets/images/logo.jpg";
import { Link } from "react-router-dom";

interface LoginProps {
  setLoggedInUser: (user: string) => void;
}

const Login = ({ setLoggedInUser }: LoginProps) => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        {/* Left: Login Form */}
        <div className="login-form">
          <h2>Welcome to Dhiever!</h2>
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

        {/* Right: Image Section (Hidden on Mobile) */}
        <div className="login-image">
          <img src={loginImage} alt="Login Visual" />
        </div>
      </div>
    </div>
  );
};

export default Login;
