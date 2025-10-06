import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, LogIn } from 'lucide-react';
import { login, getStoredCredentials, storeCredentials } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const UserLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);

  // Load stored credentials on component mount
  useEffect(() => {
    console.log('🔐 UserLogin: Loading stored credentials on mount...');
    const stored = getStoredCredentials();
    if (stored) {
      console.log('🔐 UserLogin: Found stored credentials, auto-filling form');
      setFormData({
        email: stored.email,
        password: stored.password,
      });
      setRememberMe(true);
    } else {
      console.log('🔐 UserLogin: No stored credentials found');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success && result.user) {
        // Store credentials if "Remember Me" is checked
        console.log('🔐 UserLogin: Storing credentials with Remember Me:', rememberMe);
        storeCredentials(formData.email, formData.password, rememberMe);
        
        toast({
          title: 'Login Successful',
          description: `Welcome to ${result.user.companyName}!`,
        });
        
        // Navigate to appropriate dashboard based on user role
        setTimeout(() => {
          if (result.user.role === 'super_admin') {
            navigate('/super-admin-dashboard');
          } else if (result.user.role === 'plant_admin') {
            navigate('/plant-admin-dashboard');
          } else {
            // Regular users go to welcome page first
            navigate('/user-welcome');
          }
        }, 100);
      } else {
        toast({
          title: 'Login Failed',
          description: result.error || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'An error occurred during login. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="login-container">
      <div className="w-full max-w-md">
        <Button
          onClick={() => navigate('/')}
          className="mb-6 btn-outline-modern"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>

        <div className="login-card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-3xl mb-6 shadow-lg shadow-green-500/25">
              <LogIn className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-3">
              User Login
            </h1>
            <p className="text-gray-600 text-base font-medium">Sign in to your user account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-base font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-14 text-base input-modern"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-base font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-14 text-base input-modern"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm font-medium text-gray-700">
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-16 text-lg btn-primary-modern"
            >
              <LogIn className="mr-3 h-6 w-6" />
              Login
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
