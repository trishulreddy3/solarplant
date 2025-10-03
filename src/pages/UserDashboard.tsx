import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Building2, AlertCircle, AlertTriangle, Eye, Zap } from 'lucide-react';
import { getCurrentUser, logout, getCompanies } from '@/lib/auth';
import { getTablesByCompany, getPanelsByCompany, Panel } from '@/lib/data';
import { getPlantDetails, getPanelHealthPercentage, getPanelStatus } from '@/lib/realFileSystem';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [company, setCompany] = useState<any>(null);
  const [plantDetails, setPlantDetails] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'user') {
      navigate('/user-login');
      return;
    }
    
    setUser(currentUser);
  }, [navigate]);

  useEffect(() => {
    if (user?.companyId) {
      loadData();
      
      // Set up auto-refresh
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.companyId) return;

    try {
      // Get company data from backend
      const { getAllCompanies } = await import('@/lib/realFileSystem');
      const backendCompanies = await getAllCompanies();
      const selectedCompany = backendCompanies.find(c => c.id === user.companyId);
      setCompany(selectedCompany);

      // Load plant details from file system
      const data = await getPlantDetails(user.companyId);
      setPlantDetails(data);
    } catch (error) {
      console.error('Error loading plant details:', error);
      setPlantDetails(null);
      
      // Fallback to localStorage
      const companies = getCompanies();
      const selectedCompany = companies.find(c => c.id === user.companyId);
      setCompany(selectedCompany);
    }

    const companyTables = getTablesByCompany(user.companyId);
    setTables(companyTables);

    const companyPanels = getPanelsByCompany(user.companyId);
    setPanels(companyPanels);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Function to get panel image based on realistic plant data
  const getPanelImage = (tableId: string, position: 'top' | 'bottom', panelIndex: number): string => {
    if (!plantDetails) return '/panel-images/image2.png';
    
    const healthPercentage = getPanelHealthPercentage(plantDetails, tableId, position, panelIndex);
    
    if (healthPercentage >= 100) {
      return '/panel-images/image1.png';
    } else if (healthPercentage >= 50) {
      return '/panel-images/image2.png';
    } else {
      return '/panel-images/image3.png';
    }
  };

  // Function to identify main culprit panels in series connection using realistic data
  const getMainCulpritPanels = () => {
    const culpritPanels: Array<{
      id: string;
      tableId: string;
      tableNumber: string;
      position: 'top' | 'bottom';
      panelNumber: string;
      status: string;
    }> = [];

    if (!plantDetails || !user?.companyId) return culpritPanels;

    plantDetails.tables.forEach((table: any) => {
      // Extract table number from serial number
      const tableNumber = table.serialNumber.split('-')[1] ? parseInt(table.serialNumber.split('-')[1]) : 1;

      // Check top panels for series faults
      let lastGoodIndex = -1;
      table.topPanels.power.forEach((power: number, index: number) => {
        const healthPercentage = getPanelHealthPercentage(plantDetails, table.id, 'top', index);
        const status = getPanelStatus(healthPercentage);
        
        if (status === 'fault' || status === 'average') {
          if (lastGoodIndex === index - 1) {
            culpritPanels.push({
              id: `top-${index}`,
              tableId: table.id,
              tableNumber: tableNumber.toString(),
              position: 'top',
              panelNumber: `P${index + 1}`,
              status
            });
          }
          lastGoodIndex = index;
        } else {
          lastGoodIndex = index;
        }
      });

      // Check bottom panels for series faults
      lastGoodIndex = -1;
      table.bottomPanels.power.forEach((power: number, index: number) => {
        const healthPercentage = getPanelHealthPercentage(plantDetails, table.id, 'bottom', index);
        const status = getPanelStatus(healthPercentage);
        
        if (status === 'fault' || status === 'average') {
          if (lastGoodIndex === index - 1) {
            culpritPanels.push({
              id: `bottom-${index}`,
              tableId: table.id,
              tableNumber: tableNumber.toString(),
              position: 'bottom',
              panelNumber: `P${index + 1}`,
              status
            });
          }
          lastGoodIndex = index;
        } else {
          lastGoodIndex = index;
        }
      });
    });

    return culpritPanels;
  };

  const mainCulpritPanels = plantDetails ? getMainCulpritPanels() : [];
  const repairingPanels = mainCulpritPanels.filter(p => p.status === 'average');
  const faultPanels = mainCulpritPanels.filter(p => p.status === 'fault');

  if (!user) return null;

  // Show loading state while plant details are being fetched
  if (!plantDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <header className="glass-header sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-text">
                {user.companyName || 'Solar Plant'} - Solar Plant Monitor
              </h1>
              <p className="text-sm text-muted-foreground">Welcome, {user.email} (Read-Only Access)</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-lg font-semibold mb-2">Loading Plant Data...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we fetch the latest plant information.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="glass-header sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">
              {user.companyName || 'Solar Plant'} - Solar Plant Monitor
            </h1>
            <p className="text-sm text-muted-foreground">Welcome, {user.email} (Read-Only Access)</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* Plant Overview */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Plant Overview - {user.companyName || 'Solar Plant'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Tables</p>
                    <p className="text-2xl font-bold">{plantDetails?.tables.length || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Panels</p>
                    <p className="text-2xl font-bold">
                      {plantDetails?.tables.reduce((sum: number, table: any) => 
                        sum + table.panelsTop + table.panelsBottom, 0) || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Plant Power</p>
                    <p className="text-2xl font-bold">{plantDetails?.plantPowerKW || 0} kW</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Panel Specs</p>
                    <p className="text-lg font-semibold">
                      {plantDetails?.voltagePerPanel || 0}V/{plantDetails?.currentPerPanel || 0}A
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tables and Panels */}
            {plantDetails && plantDetails.tables.length > 0 ? (
              <div className="space-y-6">
                {plantDetails.tables.map((table: any) => {
                  return (
                    <Card key={table.id} className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            {table.serialNumber}
                          </div>
                          <Badge variant="outline">
                            {table.panelsTop + table.panelsBottom} panels ({table.panelsTop} top, {table.panelsBottom} bottom)
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Top Panels Row */}
                        <div className="mb-4">
                          <div className="text-sm font-semibold text-muted-foreground mb-2">
                            Top Panels - Power: {table.topPanels.power.reduce((sum: number, p: number) => sum + p, 0).toFixed(1)}W
                          </div>
                          <div className="flex flex-wrap gap-0.5">
                            {table.topPanels.power.map((power: number, index: number) => {
                              const healthPercentage = getPanelHealthPercentage(plantDetails, table.id, 'top', index);
                              return (
                                <div key={`top-${index}`} className="relative">
                                  <img
                                    src={getPanelImage(table.id, 'top', index)}
                                    alt={`Panel P${index + 1} - ${power}W (${healthPercentage}%)`}
                                    className="w-20 h-16 object-contain"
                                    title={`P${index + 1}: ${power}W (${healthPercentage}%)`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Separator Line */}
                        <div className="border-t border-border/50 my-4"></div>

                        {/* Bottom Panels Row */}
                        <div>
                          <div className="text-sm font-semibold text-muted-foreground mb-2">
                            Bottom Panels - Power: {table.bottomPanels.power.reduce((sum: number, p: number) => sum + p, 0).toFixed(1)}W
                          </div>
                          <div className="flex flex-wrap gap-0.5">
                            {table.bottomPanels.power.map((power: number, index: number) => {
                              const healthPercentage = getPanelHealthPercentage(plantDetails, table.id, 'bottom', index);
                              return (
                                <div key={`bottom-${index}`} className="relative">
                                  <img
                                    src={getPanelImage(table.id, 'bottom', index)}
                                    alt={`Panel P${index + 1} - ${power}W (${healthPercentage}%)`}
                                    className="w-20 h-16 object-contain"
                                    title={`P${index + 1}: ${power}W (${healthPercentage}%)`}
                                  />
                                </div>
                              );
                            })}
                          </div>
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
                  <p className="text-lg font-semibold mb-2">No Tables Found</p>
                  <p className="text-sm text-muted-foreground">
                    This company has not added any tables to its plant yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Fault Summary Sidebar */}
          <div className="w-full lg:w-80 space-y-4">
            {/* Fault Panels */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Fault Panels
                </CardTitle>
              </CardHeader>
              <CardContent>
                {faultPanels.length > 0 ? (
                  <div className="space-y-2">
                    {faultPanels.map((panel) => (
                      <div
                        key={panel.id}
                        className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800"
                      >
                        <span className="font-mono text-sm font-semibold">
                          T.{panel.tableNumber}.{panel.position.toUpperCase()}.{panel.panelNumber}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          Fault
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No fault panels detected
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Repairing Panels */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Panels Under Repair
                </CardTitle>
              </CardHeader>
              <CardContent>
                {repairingPanels.length > 0 ? (
                  <div className="space-y-2">
                    {repairingPanels.map((panel) => (
                      <div
                        key={panel.id}
                        className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800"
                      >
                        <span className="font-mono text-sm font-semibold">
                          T.{panel.tableNumber}.{panel.position.toUpperCase()}.{panel.panelNumber}
                        </span>
                        <Badge variant="secondary" className="text-xs bg-yellow-500 text-yellow-900">
                          Repairing
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No panels under repair
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Fault Summary */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Fault Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Fault Panels:</span>
                  <Badge variant="destructive">{faultPanels.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Under Repair:</span>
                  <Badge variant="secondary" className="bg-yellow-500 text-yellow-900">
                    {repairingPanels.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Affected:</span>
                  <Badge variant="outline">{faultPanels.length + repairingPanels.length}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Read-Only Notice */}
            <Card className="glass-card border-blue-200 bg-blue-50 dark:bg-blue-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-semibold">Read-Only Access</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  You can monitor the solar plant but cannot make any changes. Contact your administrator for modifications.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
