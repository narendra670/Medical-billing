import React from 'react'
import { AuthProvider } from './context/AuthContext';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceList from './pages/InvoiceList';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { getApiBaseUrl } from './config/api';

// Configure axios
const configureAxios = () => {
  const apiURL = getApiBaseUrl();
  axios.defaults.baseURL = apiURL;

  if (import.meta.env.PROD && !apiURL) {
    console.info(
      'API: using same-origin /api (set VITE_API_URL to your Render URL if you are not using Vercel rewrites)'
    );
  } else if (import.meta.env.PROD && apiURL) {
    console.info('API base URL:', apiURL);
  }

  // Add request interceptor for debugging
  axios.interceptors.request.use(
    (config) => {
      console.log('Request:', config.method.toUpperCase(), config.url);
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor for error handling
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Response error:', error.response?.status, error.message);
      return Promise.reject(error);
    }
  );
};

configureAxios();

const App = () => {
  return (
    <div>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/invoices" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  )
}

export default App
