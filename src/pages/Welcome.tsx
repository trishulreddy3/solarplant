import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Sun } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mb-4">
              <Sun className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Microsyslogic
            </h1>
            <p className="text-muted-foreground text-sm">Solar Plant Monitor</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => navigate('/admin-login')}
              className="w-full h-14 text-base gradient-primary hover:opacity-90 transition-all"
              size="lg"
            >
              <Shield className="mr-2 h-5 w-5" />
              Admin Login
            </Button>

            <Button
              onClick={() => navigate('/user-login')}
              variant="outline"
              className="w-full h-14 text-base border-2 hover:bg-accent transition-all"
              size="lg"
            >
              User Login
            </Button>

            <button
              onClick={() => navigate('/forgot-password')}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 Microsyslogic. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Welcome;
