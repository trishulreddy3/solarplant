import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Sun, User } from 'lucide-react';
import { getCurrentUser, isLoggedIn } from '@/lib/auth';
import logo from '@/images/logo1.png';

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    if (isLoggedIn()) {
      const user = getCurrentUser();
      if (user) {
        // Redirect based on user role
        switch (user.role) {
          case 'super_admin':
            navigate('/super-admin-dashboard');
            break;
          case 'plant_admin':
            navigate('/plant-admin-dashboard');
            break;
          case 'user':
            navigate('/user-welcome');
            break;
        }
      }
    }
  }, [navigate]);

  return (
    <div className="login-container">
      <div className="w-full max-w-md">
        <div className="login-card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-[300px] h-[300px] md:w-[360px] md:h-[360px] mb-6">
              <img 
                src={logo} 
                alt="Microsyslogic Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to Sun icon if logo fails to load
                  const target = e.currentTarget as HTMLImageElement;
                  const fallback = target.nextElementSibling as HTMLElement;
                  target.style.display = 'none';
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="inline-flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-lg shadow-blue-500/25" style={{display: 'none'}}>
                <Sun className="w-24 h-24 md:w-28 md:h-28 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-base font-medium">Solar Plant Monitor</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => navigate('/admin-login')}
              className="w-full h-16 text-lg btn-primary-modern"
            >
              <Shield className="mr-3 h-6 w-6" />
              Admin Login
            </Button>

            <Button
              onClick={() => navigate('/user-login')}
              className="w-full h-16 text-lg btn-secondary-modern"
            >
              <User className="mr-3 h-6 w-6" />
              User Login
            </Button>

            <button
              onClick={() => navigate('/forgot-password')}
              className="w-full text-center text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8 font-medium">
          © 2025 Microsyslogic. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Welcome;