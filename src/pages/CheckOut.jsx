import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMobile, FaSignOutAlt } from 'react-icons/fa';
import logoImage from '../assets/logo.png';

const API_BASE_URL = 'http://localhost/visitor-register/api';

const CheckOut = () => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mobile || mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check out');
      }

      setVisitorInfo(data.visitor);
      setSuccess(true);
      
      setTimeout(() => {
        setMobile('');
        setSuccess(false);
        setVisitorInfo(null);
      }, 5000);
    } catch (error) {
      console.error('Error during checkout:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(value);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-3 sm:p-6 flex items-center justify-center">
      <motion.div 
        className="w-full max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-white-600 to-white-800 text-white p-5 flex flex-col items-center">
          <img 
            src={logoImage} 
            alt="YES INDIA FOUNDATION Logo" 
            className="h-20 mb-3 rounded-lg shadow-lg"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-center tracking-wide text-blue-900 p-2">YES INDIA FOUNDATION</h1>
          <h2 className="text-xl sm:text-2xl font-bold text-center tracking-wide text-blue-900 p-2">Delhi Office</h2>
          <p className="text-base sm:text-lg mt-1 font-medium text-gray-600">Visitor Check-Out</p>
        </div>

        {success && visitorInfo ? (
          <motion.div 
            className="p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FaSignOutAlt className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-3">Check-Out Successful!</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <div className="space-y-2">
                <p><span className="font-medium text-gray-700">Name:</span> {visitorInfo.name}</p>
                <p><span className="font-medium text-gray-700">Mobile:</span> {visitorInfo.mobile}</p>
                <p><span className="font-medium text-gray-700">Check-in Time:</span> {new Date(visitorInfo.check_in_time).toLocaleString()}</p>
                <p><span className="font-medium text-gray-700">Check-out Time:</span> {new Date(visitorInfo.check_out_time).toLocaleString()}</p>
                <p><span className="font-medium text-gray-700">Visit Duration:</span> {visitorInfo.duration}</p>
              </div>
            </div>
            <p className="text-gray-600 text-lg">Thank you for visiting YES INDIA FOUNDATION!</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <p className="text-center text-gray-700 mb-6 font-medium">
                Enter your mobile number to check out
              </p>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2 flex items-center">
                  <FaMobile className="mr-2 text-red-600" /> Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={handleMobileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm text-lg"
                  placeholder="Enter 10-digit mobile number"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <motion.div 
                  className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.div>
              )}
            </div>
            
            <motion.button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center text-lg font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              whileTap={{ scale: 0.95 }}
              disabled={loading || mobile.length !== 10}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <>
                  <FaSignOutAlt className="mr-2" /> Check Out
                </>
              )}
            </motion.button>
          </form>
        )}
        
        <div className="border-t border-gray-200 p-4 sm:p-5 text-center bg-gray-50">
          <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-sm sm:text-base">
            Need to Check In? Click here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckOut;