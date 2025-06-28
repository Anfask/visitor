import { Home } from "lucide-react";
import { useState, useEffect } from "react";

const NotFound = () => {
  const [countdown, setCountdown] = useState(10);
  
  useEffect(() => {
    const timer = countdown > 0 && setInterval(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    if (countdown === 0) {
      window.location.href = "/";
    }
    
    return () => clearInterval(timer);
  }, [countdown]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-md shadow-md p-8 text-center border border-gray-200">
        <h1 className="text-7xl font-light text-gray-800 mb-2">404</h1>
        
        <div className="h-px w-32 bg-gray-300 mx-auto mb-6"></div>
        
        <h2 className="text-xl font-medium text-gray-700 mb-4">Page Not Found</h2>
        
        <p className="text-gray-600 mb-8">
          The page you are looking for does not exist or has been relocated.
        </p>
        
        <div className="flex justify-center">
          <a 
            href="/" 
            className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-800 text-white rounded-md font-medium hover:bg-gray-900 transition-colors duration-200"
          >
            <Home size={16} />
            <span>Return to Homepage</span>
          </a>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          Redirecting automatically in <span className="font-medium">{countdown}</span> seconds
        </div>
      </div>
    </div>
  );
};

export default NotFound;