import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Building2, Plus, Zap, Eye, Trash2 } from 'lucide-react';
import { getCurrentUser, logout, getCompanies, type Company } from '@/lib/auth';
import { getTablesByCompany } from '@/lib/data';
import { getAllCompanies, checkServerStatus, deleteCompanyFolder } from '@/lib/realFileSystem';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [companies, setCompanies] = useState<Company[]>([]);
  const [serverStatus, setServerStatus] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    company: Company | null;
  }>({ isOpen: false, company: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'super_admin') {
      navigate('/admin-login');
      return;
    }
    setUser(currentUser);
    
    // Check server status and load companies
    const loadData = async () => {
      try {
        const isServerRunning = await checkServerStatus();
        setServerStatus(isServerRunning);
        
        if (isServerRunning) {
          const fileSystemCompanies = await getAllCompanies();
          setCompanies(fileSystemCompanies);
        } else {
          // Fallback to localStorage if server is not running
          const localStorageCompanies = getCompanies();
          setCompanies(localStorageCompanies);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
        // Fallback to localStorage
        const localStorageCompanies = getCompanies();
        setCompanies(localStorageCompanies);
      }
    };
    
    loadData();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteCompany = (company: Company) => {
    setDeleteDialog({ isOpen: true, company });
  };

  const handleDeleteConfirm = async (password: string) => {
    if (!deleteDialog.company || !user) return;

    setIsDeleting(true);
    try {
      // Verify super admin password
      if (password !== 'super_admin_password') { // You should implement proper password verification
        throw new Error('Invalid password');
      }

      // Delete company folder
      if (serverStatus) {
        await deleteCompanyFolder(deleteDialog.company.id);
      }

      // Remove from companies list
      setCompanies(companies.filter(c => c.id !== deleteDialog.company!.id));

      // Close dialog
      setDeleteDialog({ isOpen: false, company: null });

      // Show success message
      alert(`Company "${deleteDialog.company.name}" has been permanently deleted.`);
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Failed to delete company. Please check your password and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, company: null });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="glass-header sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Super Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Microsyslogic - Monitor & Manage</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${serverStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-muted-foreground">
                {serverStatus ? 'File System Server: Online' : 'File System Server: Offline (using localStorage)'}
              </span>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Registered Companies</h2>
            <p className="text-sm text-muted-foreground">Monitor solar plant companies</p>
          </div>
          <Button onClick={() => navigate('/add-company')} className="gradient-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </div>

        {companies.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => {
              const tables = getTablesByCompany(company.id);
              return (
                <Card 
                  key={company.id} 
                  className="glass-card hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => navigate(`/company-monitor/${company.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                        {company.name}
                      </div>
                      <Badge variant="outline">{tables.length} tables</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Plant Power</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Zap className="h-3 w-3 text-primary" />
                          {company.plantPowerKW} kW
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Panel Specs</p>
                        <p className="font-semibold">{company.panelVoltage}V / {company.panelCurrent}A</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/company-monitor/${company.id}`);
                        }}
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        Monitor Activity
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCompany(company);
                        }}
                        className="px-3"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">No Companies Registered</p>
              <p className="text-muted-foreground mb-4">Get started by adding your first company</p>
              <Button onClick={() => navigate('/add-company')} className="gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Add First Company
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Company"
        description={`You are about to permanently delete the company "${deleteDialog.company?.name}". This action will remove all company data, users, tables, and plant details.`}
        entityName={deleteDialog.company?.name || ''}
        entityType="company"
        adminEmail={user?.email || ''}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SuperAdminDashboard;
