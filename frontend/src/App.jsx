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


// Set API base URL from environment variable
const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5500';
axios.defaults.baseURL = apiURL;

// Ensure credentials are included in requests
axios.defaults.withCredentials = true;


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
