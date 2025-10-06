import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, UserPlus, Copy, CheckCircle, Shield, Mail } from 'lucide-react';
import { getCurrentUser, addUser, getCompanies } from '@/lib/auth';
import { addUserToCompany } from '@/lib/realFileSystem';
import { addActivityLog } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const AddUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getCurrentUser();
  const [email, setEmail] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.companyId) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    const result = addUser(email, user.companyId);
    setGeneratedPassword(result.password);

    // Add user to company file system
    await addUserToCompany(user.companyId, email, result.password, 'user', user.email);

    // Log activity for super admin monitoring
    const companies = getCompanies();
    const company = companies.find(c => c.id === user.companyId);
    addActivityLog(
      user.companyId,
      company?.name || 'Unknown Company',
      'create',
      'user',
      result.user.id,
      email,
      `Created user account for ${email}`,
      user.email
    );

    toast({
      title: 'Success!',
      description: `User account created for ${email}`,
    });
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Password copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setEmail('');
    setGeneratedPassword('');
    setCopied(false);
  };

  if (!user || user.role !== 'plant_admin') {
    navigate('/admin-login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container max-w-2xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/plant-admin-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <UserPlus className="h-6 w-6 text-primary" />
              Add New User
            </CardTitle>
            <CardDescription>
              Create a new user account with auto-generated secure password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!generatedPassword ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">User Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="h-12"
                  />
                </div>

                <Button type="submit" className="w-full h-12 gradient-primary">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User Account
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-success/10 border-success/20">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success font-semibold">
                    User account created successfully!
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>User Email</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-mono">{email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Generated Password</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-muted rounded-lg">
                      <p className="font-mono font-bold text-lg">{generatedPassword}</p>
                    </div>
                    <Button
                      onClick={copyPassword}
                      variant="outline"
                      size="icon"
                      className="h-12 w-12"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> Please save this password securely. 
                    Share it with the user through a secure channel. This password will not be shown again.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button
                    onClick={handleReset}
                    className="flex-1 gradient-primary"
                  >
                    Add Another User
                  </Button>
                  <Button
                    onClick={() => navigate('/existing-users')}
                    variant="outline"
                    className="flex-1"
                  >
                    View All Users
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Company Information Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Company Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Microsyslogic</h3>
              <p className="text-sm text-gray-600 mb-3">
                Advanced solar plant monitoring and management system for optimal energy production.
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <Shield className="h-4 w-4 mr-2" />
                <span>Secure & Compliant</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/privacy-policy" className="text-gray-600 hover:text-primary">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms-of-service" className="text-gray-600 hover:text-primary">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/help" className="text-gray-600 hover:text-primary">
                    Help & Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href="mailto:SuperAdmin.Microsyslogic@gmail.com" className="hover:text-primary">
                    SuperAdmin.Microsyslogic@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 mt-6 pt-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
            <div>
              © 2025 Microsyslogic. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <span>GDPR Compliant</span>
              <span>•</span>
              <span>CCPA Compliant</span>
              <span>•</span>
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AddUser;
