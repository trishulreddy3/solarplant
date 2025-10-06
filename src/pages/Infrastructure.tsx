import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Zap, Plus, Eye, Building2, Shield, Mail } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getTablesByCompany } from '@/lib/data';
import { getCompanies } from '@/lib/auth';

const Infrastructure = () => {
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser());
  const [company, setCompany] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'plant_admin') {
      navigate('/admin-login');
      return;
    }

    const loadData = async () => {
      if (!user?.companyId) return;

      try {
        // Try to load from backend first
        const { getAllCompanies } = await import('@/lib/realFileSystem');
        const backendCompanies = await getAllCompanies();
        const selectedCompany = backendCompanies.find(c => c.id === user.companyId);
        
        if (selectedCompany) {
          setCompany(selectedCompany);
          
          // Load plant details to get tables
          const { getPlantDetails } = await import('@/lib/realFileSystem');
          const plantDetails = await getPlantDetails(user.companyId);
          if (plantDetails) {
            setTables(plantDetails.tables || []);
          } else {
            setTables([]);
          }
        } else {
          // Fallback to localStorage
          const companies = getCompanies();
          const userCompany = companies.find(c => c.id === user.companyId);
          setCompany(userCompany);

          const companyTables = getTablesByCompany(user.companyId);
          setTables(companyTables);
        }
      } catch (error) {
        console.error('Error loading company data:', error);
        // Fallback to localStorage
    const companies = getCompanies();
    const userCompany = companies.find(c => c.id === user.companyId);
    setCompany(userCompany);

        const companyTables = getTablesByCompany(user.companyId);
    setTables(companyTables);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  if (!user) return null;

  if (loading) {
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
            <h1 className="text-2xl font-bold text-primary">Infrastructure Management</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card className="card-modern">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-lg font-semibold mb-2">Loading Infrastructure Data...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we fetch the company information.
              </p>
            </CardContent>
          </Card>
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
  }

  if (!company) {
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
            <h1 className="text-2xl font-bold text-primary">Infrastructure Management</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card className="card-modern">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">Company Not Found</p>
              <p className="text-sm text-muted-foreground mb-4">
                Unable to load company information. Please try logging in again.
              </p>
              <Button onClick={() => navigate('/admin-login')}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
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
  }

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
          <h1 className="text-2xl font-bold text-primary">Infrastructure Management</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Plant Details */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Plant Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Plant Power</p>
              <p className="text-2xl font-bold text-primary">{company.plantPowerKW} kW</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Panel Voltage</p>
              <p className="text-2xl font-bold text-secondary">{company.voltagePerPanel} V</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Panel Current</p>
              <p className="text-2xl font-bold text-secondary">{company.currentPerPanel} A</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Tables</p>
              <p className="text-2xl font-bold">{tables.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={() => navigate('/add-table')}
            className="h-16 text-base btn-primary-modern rounded-3xl px-6 w-fit mx-auto"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add New Table
          </Button>

          <Button
            onClick={() => navigate('/plant-monitor')}
            className="h-16 text-base btn-secondary-modern rounded-3xl px-6 w-fit mx-auto"
          >
            <Eye className="mr-2 h-5 w-5" />
            View Tables & Panels
          </Button>
        </div>

        {/* Recent Tables */}
        {tables.length > 0 && (
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Recent Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tables.slice(-5).reverse().map((table) => (
                  <div
                    key={table.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20"
                  >
                    <div>
                      <p className="font-semibold">{table.serialNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {table.panelsTop + table.panelsBottom} panels total
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(table.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

export default Infrastructure;
