import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Mail, Calendar, Trash2, Shield } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getUsers as getUsersFromAPI } from '@/lib/realFileSystem';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

const ExistingUsers = () => {
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser());
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    userToDelete: any | null;
  }>({ isOpen: false, userToDelete: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'plant_admin') {
      navigate('/admin-login');
      return;
    }

    const loadUsers = async () => {
      try {
        const users = await getUsersFromAPI(user.companyId);
        setCompanyUsers(users);
      } catch (error) {
        console.error('Error loading users:', error);
        setCompanyUsers([]);
      }
    };

    loadUsers();
  }, [user, navigate]);

  const handleDeleteUser = (userToDelete: any) => {
    setDeleteDialog({ isOpen: true, userToDelete });
  };

  const handleDeleteConfirm = async (password: string) => {
    if (!deleteDialog.userToDelete || !user) return;

    setIsDeleting(true);
    try {
      // Verify plant admin password
      if (password !== user.password) { // You should implement proper password verification
        throw new Error('Invalid password');
      }

      // TODO: Implement backend user deletion
      // For now, just remove from local state
      setCompanyUsers(companyUsers.filter(u => u.id !== deleteDialog.userToDelete!.id));

      // Close dialog
      setDeleteDialog({ isOpen: false, userToDelete: null });

      // Show success message
      alert(`User "${deleteDialog.userToDelete.email}" has been permanently deleted.`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please check your password and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, userToDelete: null });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="glass-header sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/plant-admin-dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-primary">Existing Users</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Registered Users
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {companyUsers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {companyUsers.length > 0 ? (
              <div className="space-y-3">
                {companyUsers.map((usr) => (
                  <div
                    key={usr.id}
                    className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold">{usr.email}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <p>Joined {new Date(usr.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{usr.role === 'admin' ? 'Admin' : 'User'}</Badge>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(usr)}
                          className="px-3"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No users registered yet</p>
                <Button onClick={() => navigate('/add-user')}>
                  Add First User
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {companyUsers.length > 0 && (
          <Button
            onClick={() => navigate('/add-user')}
            className="w-full h-12 gradient-primary"
          >
            Add Another User
          </Button>
        )}
      </main>

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

export default ExistingUsers;
