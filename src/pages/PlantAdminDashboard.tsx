import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Settings, Users, Plus, RefreshCw } from 'lucide-react';
import { getCurrentUser, logout } from '@/lib/auth';
import { syncUserCompanyId } from '@/lib/companySync';
import { useToast } from '@/hooks/use-toast';

const PlantAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const initializeUser = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== 'plant_admin') {
        navigate('/admin-login');
        return;
      }
      
      // Sync user's company ID with backend
      await syncUserCompanyId();
      
      // Get updated user data
      const updatedUser = getCurrentUser();
      setUser(updatedUser);
    };
    
    initializeUser();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSyncCompany = async () => {
    try {
      const synced = await syncUserCompanyId();
      if (synced) {
        const updatedUser = getCurrentUser();
        setUser(updatedUser);
        toast({
          title: 'Company Synchronized',
          description: 'Your company ID has been updated to match the backend system.',
        });
      } else {
        toast({
          title: 'Synchronization Complete',
          description: 'Your company ID is already synchronized with the backend.',
        });
      }
    } catch (error) {
      console.error('Error syncing company:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to synchronize company ID. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="glass-header sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              WELCOME {user.companyName?.toUpperCase()} ADMIN
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSyncCompany} className="btn-outline-modern px-4 py-2">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Company
            </Button>
            <Button onClick={handleLogout} className="btn-outline-modern px-4 py-2">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card
            className="card-modern hover:shadow-2xl transition-all cursor-pointer group"
            onClick={() => navigate('/infrastructure')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary group-hover:rotate-90 transition-transform" />
                Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage plant power, panels, and tables configuration
              </p>
            </CardContent>
          </Card>

          <Card
            className="card-modern hover:shadow-2xl transition-all cursor-pointer group"
            onClick={() => navigate('/existing-users')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                Existing Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage all registered users
              </p>
            </CardContent>
          </Card>

          <Card
            className="card-modern hover:shadow-2xl transition-all cursor-pointer group"
            onClick={() => navigate('/add-user')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                Add New User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create new user accounts with auto-generated passwords
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PlantAdminDashboard;
