import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, UserPlus, Copy, CheckCircle } from 'lucide-react';
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
    </div>
  );
};

export default AddUser;
