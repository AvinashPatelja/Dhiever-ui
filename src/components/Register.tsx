import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Constants from '../Constants';
import './Register.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import registerImage from "../assets/images/loginPump.jpg";
import logo from "/src/assets/images/logo.jpg";

const Register: React.FC = () => {
  
  const [formData, setFormData] = useState({
    userName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    imei: '',
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(Constants.BASE_URL + '/Auth/Register', formData);
      toast.success('Registration successful! Redirecting to login...', {
        position: 'top-right',
        autoClose: 2000, // Redirect after 2 seconds
      });

      setTimeout(() => {
        navigate('/');
      }, 2000); // Redirect to login after showing toast
    } catch (error: any) {
      if (error.response) {
        toast.error(error.response.data.message || 'Registration failed');
      } else {
        toast.error('An error occurred during registration.');
      }
    }
  };

  return (
    <div className="register-container">
      <ToastContainer />
      <div className="register-box">
        <div className="register-form-wrap">
          <p className="register-eyebrow">Create Account</p>
          <h2>Join Dhiever</h2>
          <div className="register-logo">
            <img src={logo} alt="Logo" />
          </div>
          <form onSubmit={handleRegister}>
            <input name="userName" placeholder="User Name" onChange={handleChange} required />
            <input name="firstName" placeholder="First Name" onChange={handleChange} required />
            <input name="lastName" placeholder="Last Name" onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
            <input name="imei" placeholder="IMEI" onChange={handleChange} required />
            <button type="submit">Sign Up</button>
          </form>
        </div>
        <div className="register-image">
          <img src={registerImage} alt="Water Pump Setup" />
          <div className="register-image-overlay">
            <h3>Field Ready Monitoring</h3>
            <p>Register once and map your device IMEI for full dashboard control.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
