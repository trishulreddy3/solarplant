import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Zap, Plus, Eye } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getTablesByCompany } from '@/lib/data';
import { getCompanies } from '@/lib/auth';

const Infrastructure = () => {
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser());
  const [company, setCompany] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'plant_admin') {
      navigate('/admin-login');
      return;
    }

    const companies = getCompanies();
    const userCompany = companies.find(c => c.id === user.companyId);
    setCompany(userCompany);

    const companyTables = getTablesByCompany(user.companyId!);
    setTables(companyTables);
  }, [user, navigate]);

  if (!user || !company) return null;

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
          <h1 className="text-2xl font-bold gradient-text">Infrastructure Management</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Plant Details */}
        <Card className="glass-card">
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
              <p className="text-2xl font-bold text-secondary">{company.panelVoltage} V</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Panel Current</p>
              <p className="text-2xl font-bold text-secondary">{company.panelCurrent} A</p>
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
            size="lg"
            className="h-24 gradient-primary text-lg"
          >
            <Plus className="mr-2 h-6 w-6" />
            Add New Table
          </Button>

          <Button
            onClick={() => navigate('/view-tables')}
            size="lg"
            variant="outline"
            className="h-24 text-lg border-2"
          >
            <Eye className="mr-2 h-6 w-6" />
            View Tables & Panels
          </Button>
        </div>

        {/* Recent Tables */}
        {tables.length > 0 && (
          <Card className="glass-card">
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
    </div>
  );
};

export default Infrastructure;
