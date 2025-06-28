import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { FaCamera, FaUserAlt, FaMobile, FaIdCard, FaClipboardList, FaHome, FaBriefcase } from 'react-icons/fa';
import logoImage from '../assets/logo.png';

const API_BASE_URL = 'http://localhost/visitor-register/api';

const CheckIn = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    idType: 'aadhar',
    idNumber: '',
    purpose: '',
    address: '',
    designation: '',
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const webcamRef = useRef(null);
  const audioRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState("user");

  const idTypes = [
    { value: 'aadhar', label: 'Aadhar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'voter', label: 'Voter ID' },
    { value: 'other', label: 'Other' },
    { value: 'none', label: 'None' },
  ];

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      setIsMobile(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent));
    };
    
    checkMobile();
    
    const requestCameraPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraError(false);
      } catch (err) {
        console.error("Camera permission denied:", err);
        setCameraError(true);
        alert("Camera access is required for visitor registration. Please allow camera access.");
      }
    };
    
    requestCameraPermission();
    
    const audio = new Audio("/welcome-audio.mp3");
    audioRef.current = audio;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const switchCamera = () => {
    setCameraFacingMode(prevMode => prevMode === "user" ? "environment" : "user");
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setPhoto(imageSrc);
      setStep(2);
    } else {
      alert("Camera not available or not initialized properly.");
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    setStep(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveImageToServer = async (dataUrl, mobile) => {
    try {
      const response = await fetch(`${API_BASE_URL}/save-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataUrl,
          mobile,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save image');
      }

      const result = await response.json();
      return {
        filename: result.filename,
        imageUrl: `http://localhost/visitor-register${result.path}`,
      };
    } catch (error) {
      console.error('Error saving image to server:', error);
      throw error;
    }
  };

  const submitToBackend = async (visitorData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check in');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error submitting to backend:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!photo || !formData.name || !formData.mobile || !formData.purpose) {
      alert('Please fill all required fields and capture your photo');
      return;
    }

    setLoading(true);

    try {
      // First save the image
      const { filename, imageUrl } = await saveImageToServer(photo, formData.mobile);
      
      // Then submit visitor data
      const visitorData = {
        ...formData,
        imageName: filename,
        imageUrl: imageUrl,
      };

      await submitToBackend(visitorData);

      if (audioRef.current) {
        audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      }

      setSuccess(true);
      
      setTimeout(() => {
        setFormData({
          name: '',
          mobile: '',
          idType: 'aadhar',
          idNumber: '',
          purpose: '',
          address: '',
          designation: '',
        });
        setPhoto(null);
        setStep(1);
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(`An error occurred: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-3 sm:p-6 flex items-center justify-center">
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
          <p className="text-base sm:text-lg mt-1 font-medium text-gray-600">Visitor Register</p>
        </div>

        {success ? (
          <motion.div 
            className="p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-3">Check-In Successful!</h2>
            <p className="text-gray-600 text-lg">Welcome to YES INDIA FOUNDATION.</p>
          </motion.div>
        ) : (
          <>
            {step === 1 ? (
              <div className="p-5">
                <div className="mb-5">
                  <p className="text-center text-gray-700 mb-3 font-medium">Please look at the camera and take your photo</p>
                  <div className="relative rounded-xl overflow-hidden bg-gray-200 w-full h-64 sm:h-80 shadow-inner">
                    {cameraError ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <p className="text-red-500 text-center p-4">
                          Camera access denied. Please enable camera permissions and refresh the page.
                        </p>
                      </div>
                    ) : (
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ 
                          facingMode: cameraFacingMode,
                          width: { ideal: 1280 },
                          height: { ideal: 720 }
                        }}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  {isMobile && (
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm inline-flex items-center"
                        onClick={switchCamera}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                        </svg>
                        Switch Camera
                      </button>
                    </div>
                  )}
                </div>
                <motion.button
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center text-base sm:text-lg font-medium shadow-md"
                  whileTap={{ scale: 0.95 }}
                  onClick={capturePhoto}
                  disabled={cameraError}
                >
                  <FaCamera className="mr-2" /> Capture Photo
                </motion.button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5">
                <div className="mb-5">
                  <p className="text-center text-gray-700 mb-3 font-medium">Preview your photo</p>
                  <div className="relative rounded-xl overflow-hidden bg-gray-200 w-40 h-40 mx-auto mb-3 shadow-md">
                    {photo && <img src={photo} alt="Captured" className="w-full h-full object-cover" />}
                  </div>
                  <div className="text-center">
                    <button 
                      type="button" 
                      className="text-blue-600 text-sm font-medium hover:text-blue-800" 
                      onClick={retakePhoto}
                    >
                      Retake Photo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 font-medium mb-1 flex items-center">
                      <FaUserAlt className="mr-2 text-blue-600" /> Full Name <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 font-medium mb-1 flex items-center">
                      <FaMobile className="mr-2 text-blue-600" /> Mobile Number <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      pattern="[0-9]{10}"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      placeholder="10 digit mobile number"
                      required
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 font-medium mb-1 flex items-center">
                      <FaHome className="mr-2 text-blue-600" /> Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      rows="3"
                      placeholder="Enter your address"
                    ></textarea>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 font-medium mb-1 flex items-center">
                      <FaBriefcase className="mr-2 text-blue-600" /> Designation
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      placeholder="Enter your designation (e.g., Manager, Student)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 flex items-center">
                      <FaIdCard className="mr-2 text-blue-600" /> ID Type
                    </label>
                    <select
                      name="idType"
                      value={formData.idType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                      {idTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">ID Number</label>
                    <input
                      type="text"
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      placeholder="If applicable"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 font-medium mb-1 flex items-center">
                      <FaClipboardList className="mr-2 text-blue-600" /> Purpose of Visit <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      rows="3"
                      placeholder="Please mention your purpose of visit"
                      required
                    ></textarea>
                  </div>
                </div>
                
                <motion.button
                  type="submit"
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center text-base sm:text-lg font-medium shadow-md"
                  whileTap={{ scale: 0.95 }}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : 'Check In'}
                </motion.button>
              </form>
            )}
          </>
        )}
        
        <div className="border-t border-gray-200 p-4 sm:p-5 text-center bg-gray-50">
          <Link to="/checkout" className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-sm sm:text-base">
            Need to Check Out? Click here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckIn;