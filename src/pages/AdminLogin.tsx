import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, LogIn } from 'lucide-react';
import { login, getStoredCredentials, storeCredentials } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const AdminLogin = () => {  
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    companyName: '',
  });
  const [rememberMe, setRememberMe] = useState(false);

  // Load stored credentials on component mount
  useEffect(() => {
    console.log('🔐 AdminLogin: Loading stored credentials on mount...');
    const stored = getStoredCredentials();
    if (stored) {
      console.log('🔐 AdminLogin: Found stored credentials, auto-filling form');
      setFormData({
        loginId: stored.email,
        password: stored.password,
        companyName: '',
      });
      setRememberMe(true);
    } else {
      console.log('🔐 AdminLogin: No stored credentials found');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await login(formData.loginId, formData.password, formData.companyName);
      
      if (result.success && result.user) {
        // Store credentials if "Remember Me" is checked
        console.log('🔐 AdminLogin: Storing credentials with Remember Me:', rememberMe);
        storeCredentials(formData.loginId, formData.password, rememberMe);
        
        toast({
          title: 'Login Successful',
          description: `Welcome ${result.user.role === 'super_admin' ? 'Super Admin' : 'Admin'}!`,
        });
        
        // Navigate to appropriate dashboard based on user role
        setTimeout(() => {
          if (result.user.role === 'super_admin') {
            navigate('/super-admin-dashboard');
          } else {
            navigate('/plant-admin-dashboard');
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-lg shadow-blue-500/25">
              <LogIn className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-3">
              Admin Login
            </h1>
            <p className="text-gray-600 text-base font-medium">Sign in to your admin account</p>
          </div>{/* AdminLogin.tsx closing div */}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">{/* companyName div opening div */}  
              <Label htmlFor="companyName" className="text-base font-medium text-gray-700">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Enter your company name"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value.toLowerCase() })}
                required
                className="h-14 text-base input-modern"
              />
            </div>{/* companyName div */}

            <div className="space-y-3">{/* loginId div */}
              <Label htmlFor="loginId" className="text-base font-medium text-gray-700">Login ID / Email</Label>
              <Input
                id="loginId"
                type="email"
                placeholder="Enter your email"
                value={formData.loginId}
                onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                required
                className="h-14 text-base input-modern"
              />
            </div>{/* loginId div closing div */}

            <div className="space-y-3">{/* password div */}
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
            </div>{/* password div */}

            <div className="flex items-center space-x-2">{/* remember me div opening div */}
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm font-medium text-gray-700">
                Remember me
              </Label>
            </div>{/* remember me div closing div */}

            <Button
              type="submit"
              className="w-full h-16 text-lg btn-primary-modern"
            >
              <LogIn className="mr-3 h-6 w-6" />
              Login
            </Button>
          </form>{/* form closing div */}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">{/* demo credentials */}
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Demo Credentials:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>Super Admin:</strong></div>
              <div>Company: microsyslogic (fixed)</div>
              <div>Email: super_admin@microsyslogic.com</div>
              <div>Password: super_admin_password</div>
              <div className="mt-2"><strong>Plant Admin:</strong></div>
              <div>Company: [Check backend companies]</div>
              <div>Email: [Admin email from company]</div>
              <div>Password: [Admin password from company]</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
