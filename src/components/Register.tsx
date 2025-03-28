import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Constants from '../Constants';
import './Register.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    <div >
      <ToastContainer />
      <div className="register-box">
        <h2>Register</h2>
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
    </div>
  );
};

export default Register;
