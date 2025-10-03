import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Sun, User } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="w-full max-w-md">
        <div className="login-card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-lg shadow-blue-500/25">
              <Sun className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Microsyslogic
            </h1>
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