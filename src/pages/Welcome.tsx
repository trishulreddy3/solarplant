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
=======
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, User, ShieldCheck } from 'lucide-react';
import AdminLogin from '@/components/auth/AdminLogin';
import UserLogin from '@/components/auth/UserLogin';

const Welcome = () => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);

  if (showAdminLogin) {
    return <AdminLogin onBack={() => setShowAdminLogin(false)} />;
  }

  if (showUserLogin) {
    return <UserLogin onBack={() => setShowUserLogin(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center glow-effect">
              <span className="text-3xl font-bold text-white">PM</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MicroSysLogic Solar Plant Monitor
          </h1>
          <p className="text-xl text-muted-foreground">
            Advanced monitoring and management system for solar power plants
          </p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-2 gap-8 animate-scale-in">
          {/* Admin Login Card */}
          <div className="glass-panel p-8 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center glow-effect">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center mb-4">Admin Login</h2>
            <p className="text-muted-foreground text-center mb-6">
              Access control panel for Super Admin and Plant Administrators
            </p>
            <Button 
              onClick={() => setShowAdminLogin(true)}
              className="w-full gradient-primary text-white font-semibold py-6 text-lg hover:opacity-90 transition-opacity"
            >
              Login as Admin
            </Button>
          </div>

          {/* User Login Card */}
          <div className="glass-panel p-8 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
                <User className="w-10 h-10 text-accent" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center mb-4">User Login</h2>
            <p className="text-muted-foreground text-center mb-6">
              Monitor your assigned solar panels and view system status
            </p>
            <Button 
              onClick={() => setShowUserLogin(true)}
              className="w-full bg-accent/20 border-2 border-accent text-accent font-semibold py-6 text-lg hover:bg-accent/30 transition-colors"
              variant="outline"
            >
              Login as User
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground animate-fade-in">
          <p>© 2025 Microsyslogic. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
