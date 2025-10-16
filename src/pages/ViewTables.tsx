import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Activity, AlertCircle, CheckCircle, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getTablesByCompany, getPanelsByCompany, updatePanelData, Panel, migratePanels, getPanels, savePanels, getTables, saveTables, addActivityLog } from '@/lib/data';
import { getCompanies } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { getAllCompanies, getPlantDetails, deletePanel, refreshPanelData, PlantDetails } from '@/lib/realFileSystem'; // Import from realFileSystem

const ViewTables = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user] = useState(getCurrentUser());
  const [tables, setTables] = useState<any[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [plantDetails, setPlantDetails] = useState<PlantDetails | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [panelToDelete, setPanelToDelete] = useState<Panel | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<any>(null);
  const [showDeleteTableDialog, setShowDeleteTableDialog] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'plant_admin') {
      navigate('/admin-login');
      return;
    }

    loadData();

    // Continuous simulation: Auto-refresh panel data every 10-15 seconds
    const refreshPanelDataFunction = async () => {
      try {
        if (user?.companyId) {
          console.log('🔄 Refreshing panel data for simulation...');
          await refreshPanelData(user.companyId);
          // Reload data after refresh
          loadData();
        }
      } catch (error) {
        console.error('Error refreshing panel data:', error);
      }      
    };

    const interval = setInterval(() => {
      // Random refresh interval between 10-15 seconds for realistic simulation
      const delay = 10000 + Math.random() * 5000;
      setTimeout(refreshPanelDataFunction, delay);
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [user, navigate]);

  const loadData = async () => {
    if (!user?.companyId) return;
    
    try {
      // Try to load from backend first
      const { getAllCompanies, getPlantDetails } = await import('@/lib/realFileSystem');
      const backendCompanies = await getAllCompanies();
      const selectedCompany = backendCompanies.find(c => c.id === user.companyId);
      
      if (selectedCompany) {
        // Load plant details from backend
        const plantDetails = await getPlantDetails(user.companyId);
        if (plantDetails) {
          setPlantDetails(plantDetails); // Store plant details for use in table
          setTables(plantDetails.tables || []);
          
          // Generate panels from plant details
          const generatedPanels: Panel[] = [];
          plantDetails.tables.forEach((table: any) => {
            // Top panels with backend simulation data
            for (let i = 0; i < table.panelsTop; i++) {
              const voltage = table.topPanels?.voltage?.[i] || plantDetails.voltagePerPanel;
              const current = table.topPanels?.current?.[i] || plantDetails.currentPerPanel;
              const power = voltage * current;
              
              // Calculate health percentage based on expected vs actual power
              const expectedPower = plantDetails.voltagePerPanel * plantDetails.currentPerPanel;
              const healthPercentage = Math.round((power / expectedPower) * 100);
              
              // Get panel state from backend simulation
              const panelState = table.topPanels?.states?.[i] || 'good';
              
              generatedPanels.push({
                id: `${table.id}-top-${i}`,
                tableId: table.id,
                companyId: user.companyId,
                name: `P${i + 1}`,
                position: 'top' as const,
                maxVoltage: 40,
                maxCurrent: 10,
                currentVoltage: Math.round(voltage * 10) / 10,
                currentCurrent: Math.round(current * 10) / 10,
                powerGenerated: Math.round(power * 10) / 10,
                status: healthPercentage >= 80 ? 'good' as const : 
                       healthPercentage >= 10 ? 'average' as const : 'fault' as const,
                state: panelState as 'good' | 'repairing' | 'fault',
                lastUpdated: new Date().toISOString(),
              });
            }
            
            // Bottom panels with backend simulation data
            for (let i = 0; i < table.panelsBottom; i++) {
              const voltage = table.bottomPanels?.voltage?.[i] || plantDetails.voltagePerPanel;
              const current = table.bottomPanels?.current?.[i] || plantDetails.currentPerPanel;
              const power = voltage * current;
              
              // Calculate health percentage based on expected vs actual power
              const expectedPower = plantDetails.voltagePerPanel * plantDetails.currentPerPanel;
              const healthPercentage = Math.round((power / expectedPower) * 100);
              
              // Get panel state from backend simulation
              const panelState = table.bottomPanels?.states?.[i] || 'good';
              
              generatedPanels.push({
                id: `${table.id}-bottom-${i}`,
                tableId: table.id,
                companyId: user.companyId,
                name: `P${i + 1}`,
                position: 'bottom' as const,
                maxVoltage: 40,
                maxCurrent: 10,
                currentVoltage: Math.round(voltage * 10) / 10,
                currentCurrent: Math.round(current * 10) / 10,
                powerGenerated: Math.round(power * 10) / 10,
                status: healthPercentage >= 80 ? 'good' as const : 
                       healthPercentage >= 10 ? 'average' as const : 'fault' as const,
                state: panelState as 'good' | 'repairing' | 'fault',
                lastUpdated: new Date().toISOString(),
              });
            }
          });
          
          // Panel power is already calculated from backend data, no need to recalculate
          
          setPanels(generatedPanels);
        } else {
          setTables([]);
          setPanels([]);
        }
      } else {
        // Fallback to localStorage
        migratePanels();
        
        const companyTables = getTablesByCompany(user.companyId);
        setTables(companyTables);

        const companyPanels = getPanelsByCompany(user.companyId);
        setPanels(companyPanels);

        // Simulate data updates
        companyPanels.forEach(panel => {
          if (Math.random() > 0.7) {
            updatePanelData(panel.id);
          }
        });
      }
    } catch (error) {
      console.error('Error loading plant details:', error);
      // Fallback to localStorage
      migratePanels();
      
      const companyTables = getTablesByCompany(user.companyId);
      setTables(companyTables);

      const companyPanels = getPanelsByCompany(user.companyId);
      setPanels(companyPanels);

      // Simulate data updates
      companyPanels.forEach(panel => {
        if (Math.random() > 0.7) {
          updatePanelData(panel.id);
        }
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      case 'average':
        return <AlertTriangle className="h-4 w-4" />;
      case 'fault':
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'good':
        return 'status-good';
      case 'average':
        return 'status-average';
      case 'fault':
        return 'status-fault';
      default:
        return '';
    }
  };

  const toggleEditMode = (tableId: string) => {
    setEditingTableId(editingTableId === tableId ? null : tableId);
  };

  const handlePanelClick = (panel: Panel, tableId: string) => {
    if (editingTableId === tableId) {
      setPanelToDelete(panel);
      setShowDeleteDialog(true);
    }
  };

  const confirmDeletePanel = async () => {
    if (!panelToDelete || !user) return;

    try {
      // Delete panel from backend
      const success = await deletePanel(user.companyId, panelToDelete.id);
      
      if (success) {
        // Reload data from backend to reflect changes
        const plantDetails = await getPlantDetails(user.companyId);
        if (plantDetails) {
          setTables(plantDetails.tables || []);
          
          // Generate panels from backend plant details with realistic series data
          const generatedPanels: Panel[] = [];
          plantDetails.tables.forEach((table: any) => {
            // Top panels with realistic series connection behavior
            for (let i = 0; i < table.panelsTop; i++) {
              const voltage = table.topPanels?.voltage?.[i] || plantDetails.voltagePerPanel;
              const current = table.topPanels?.current?.[i] || plantDetails.currentPerPanel;
              const power = voltage * current;
              
              // Calculate health percentage based on expected vs actual power
              const expectedPower = plantDetails.voltagePerPanel * plantDetails.currentPerPanel;
              const healthPercentage = Math.round((power / expectedPower) * 100);
              
              // Get panel state from backend simulation
              const panelState = table.topPanels?.states?.[i] || 'good';
              const panelHealth = table.topPanels?.health?.[i] || healthPercentage;
              
              generatedPanels.push({
                id: `${table.id}-top-${i}`,
                tableId: table.id,
                companyId: user.companyId,
                name: `P${i + 1}`,
                position: 'top' as const,
                maxVoltage: 40,
                maxCurrent: 10,
                currentVoltage: Math.round(voltage * 10) / 10,
                currentCurrent: Math.round(current * 10) / 10,
                powerGenerated: Math.round(power * 10) / 10,
                status: healthPercentage >= 80 ? 'good' as const : 
                       healthPercentage >= 10 ? 'average' as const : 'fault' as const,
                state: panelState as 'good' | 'repairing' | 'fault',
                lastUpdated: new Date().toISOString(),
              });
            }
            
            // Bottom panels with realistic series connection behavior
            for (let i = 0; i < table.panelsBottom; i++) {
              const voltage = table.bottomPanels?.voltage?.[i] || plantDetails.voltagePerPanel;
              const current = table.bottomPanels?.current?.[i] || plantDetails.currentPerPanel;
              const power = voltage * current;
              
              // Calculate health percentage based on expected vs actual power
              const expectedPower = plantDetails.voltagePerPanel * plantDetails.currentPerPanel;
              const healthPercentage = Math.round((power / expectedPower) * 100);
              
              // Get panel state from backend simulation
              const panelState = table.bottomPanels?.states?.[i] || 'good';
              const panelHealth = table.bottomPanels?.health?.[i] || healthPercentage;
              
              generatedPanels.push({
                id: `${table.id}-bottom-${i}`,
                tableId: table.id,
                companyId: user.companyId,
                name: `P${i + 1}`,
                position: 'bottom' as const,
                maxVoltage: 40,
                maxCurrent: 10,
                currentVoltage: Math.round(voltage * 10) / 10,
                currentCurrent: Math.round(current * 10) / 10,
                powerGenerated: Math.round(power * 10) / 10,
                status: healthPercentage >= 80 ? 'good' as const : 
                       healthPercentage >= 10 ? 'average' as const : 'fault' as const,
                state: panelState as 'good' | 'repairing' | 'fault',
                lastUpdated: new Date().toISOString(),
              });
            }
          });
          
          setPanels(generatedPanels);
        }

        // Log activity for super admin monitoring
        const companies = getCompanies();
        const company = companies.find(c => c.id === user.companyId);
        addActivityLog(
          user.companyId,
          company?.name || 'Unknown Company',
          'delete',
          'panel',
          panelToDelete.id,
          panelToDelete.name,
          `Deleted panel ${panelToDelete.name} from table`,
          user.email
        );

        toast({
          title: 'Panel Deleted',
          description: `Panel ${panelToDelete.name} has been removed from the table.`,
        });
      } else {
        toast({
          title: 'Deletion Failed',
          description: 'Failed to delete the panel. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting panel:', error);
      toast({
        title: 'Deletion Failed',
        description: 'An error occurred while deleting the panel. Please try again.',
        variant: 'destructive'
      });
    }

    setShowDeleteDialog(false);
    setPanelToDelete(null);
  };

  const cancelDeletePanel = () => {
    setShowDeleteDialog(false);
    setPanelToDelete(null);
  };

  const handleDeleteTable = (table: any) => {
    setTableToDelete(table);
    setShowDeleteTableDialog(true);
  };

  const confirmDeleteTable = () => {
    if (!tableToDelete || !user?.companyId) return;

    // Get all tables and panels
    const allTables = getTables();
    const allPanels = getPanels();

    // Count panels to be deleted
    const panelsToDelete = allPanels.filter(p => p.tableId === tableToDelete.id);

    // Remove the table and its panels
    const updatedTables = allTables.filter(t => t.id !== tableToDelete.id);
    const updatedPanels = allPanels.filter(p => p.tableId !== tableToDelete.id);

    // Renumber remaining tables
    const renumberedTables = updatedTables.map((table, index) => ({
      ...table,
      serialNumber: `TBL-${String(index + 1).padStart(4, '0')}`
    }));

    // Save updated data
    saveTables(renumberedTables);
    savePanels(updatedPanels);

    // Update local state
    const companyTables = renumberedTables.filter(t => t.companyId === user.companyId);
    setTables(companyTables);
    setPanels(updatedPanels.filter(p => p.companyId === user.companyId));

    // Log activity for super admin monitoring
    const companies = getCompanies();
    const company = companies.find(c => c.id === user.companyId);

    addActivityLog(
      user.companyId,
      company?.name || 'Unknown Company',
      'delete',
      'table',
      tableToDelete.id,
      tableToDelete.serialNumber,
      `Deleted table ${tableToDelete.serialNumber} with ${panelsToDelete.length} panels. Table numbers rearranged.`,
      user.email
    ); //Super Admin Monitoring

    toast({
      title: 'Table Deleted',
      description: `Table ${tableToDelete.serialNumber} and all its panels have been removed. Table numbers have been rearranged.`,
    });

    setShowDeleteTableDialog(false);
    setTableToDelete(null);
    setEditingTableId(null); // Exit edit mode
  }; 

  const cancelDeleteTable = () => {
    setShowDeleteTableDialog(false);
    setTableToDelete(null);
  }; 

  // Function to calculate panel health percentage
  const getPanelHealthPercentage = (panel: Panel): number => {
    const maxPower = panel.maxVoltage * panel.maxCurrent; // Maximum possible power
    const currentPower = panel.powerGenerated; // Current power output
    const healthPercentage = (currentPower / maxPower) * 100;
    return Math.round(healthPercentage);
  };

  // Function to identify main culprit panels in series connection
  const getMainCulpritPanels = () => {
    const culpritPanels: Array<{
      id: string;
      tableId: string;
      tableNumber: string;
      position: 'top' | 'bottom';
      panelNumber: string;
      status: string;
    }> = [];

    tables.forEach(table => {
      const tablePanels = panels.filter(p => p.tableId === table.id);
      const topPanels = tablePanels.filter(p => p.position === 'top').sort((a, b) => {
        if (!a.name || !b.name) return 0;
        const aNum = parseInt(a.name.substring(1)) || 0;
        const bNum = parseInt(b.name.substring(1)) || 0;
        return aNum - bNum;
      });
      const bottomPanels = tablePanels.filter(p => p.position === 'bottom').sort((a, b) => {
        if (!a.name || !b.name) return 0;
        const aNum = parseInt(a.name.substring(1)) || 0;
        const bNum = parseInt(b.name.substring(1)) || 0;
        return aNum - bNum;
      });

      // Extract table number from serial number (e.g., "TBL-0001" -> "1")
      const tableNumber = table.serialNumber.split('-')[1] ? parseInt(table.serialNumber.split('-')[1]) : 1;

      // Check top panels for actual faults ONLY (not series effect panels)
      topPanels.forEach((panel, index) => {
        // Only show panels that are actually faulty (repairing or fault), not just affected by series connection
        if (panel.state === 'repairing' || panel.state === 'fault') {
          // Verify this panel has low health (actually needs repair)
          const healthPercentage = getPanelHealthPercentage(panel);
          if (healthPercentage < 80) {
            culpritPanels.push({
              id: panel.id,
              tableId: table.id,
              tableNumber: tableNumber.toString(),
              position: 'top',
              panelNumber: panel.name,
              status: panel.state // Use state from backend simulation
            });
          }
        }
      });

      // Check bottom panels for actual faults ONLY (not series effect panels)
      bottomPanels.forEach((panel, index) => {
        // Only show panels that are actually faulty (repairing or fault), not just affected by series connection
        if (panel.state === 'repairing' || panel.state === 'fault') {
          // Verify this panel has low health (actually needs repair)
          const healthPercentage = getPanelHealthPercentage(panel);
          if (healthPercentage < 80) {
            culpritPanels.push({
              id: panel.id,
              tableId: table.id,
              tableNumber: tableNumber.toString(),
              position: 'bottom',
              panelNumber: panel.name,
              status: panel.state // Use state from backend simulation
            });
          }
        }
      });
    });

    return culpritPanels;
  };

  const mainCulpritPanels = getMainCulpritPanels();
  const repairingPanels = mainCulpritPanels.filter(p => p.status === 'average');
  const faultPanels = mainCulpritPanels.filter(p => p.status === 'fault');

  // Function to get panel image based on panel state from backend simulation
  const getPanelImage = (panel: Panel): string => {
    // Check if panel has state information from backend simulation
    if (panel.state) {
      switch (panel.state) {
        case 'good':
          return '/images/panels/image1.png'; // Blue - Good condition
        case 'repairing':
          return '/images/panels/image2.png'; // Orange - Repairing/Cleaning
        case 'fault':
          return '/images/panels/image3.png'; // Red - Fault condition
        default:
          return '/images/panels/image1.png'; // Default to good
      }
    }
    
    // Fallback to health percentage for backward compatibility
    const healthPercentage = getPanelHealthPercentage(panel);
    
    if (healthPercentage >= 80) {
      return '/images/panels/image1.png'; // Blue - Good condition
    } else if (healthPercentage >= 20) {
      return '/images/panels/image2.png'; // Orange - Repairing condition
    } else {
      return '/images/panels/image3.png'; // Red - Fault condition
    }
  };

  const stats = {
    total: panels.length,
    good: panels.filter(p => p.status === 'good').length,
    average: panels.filter(p => p.status === 'average').length,
    fault: panels.filter(p => p.status === 'fault').length,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="glass-header sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/infrastructure')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Infrastructure
          </Button>
          <h1 className="text-2xl font-bold text-primary">Tables & Panels Dashboard</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Total Panels</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card status-good">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Good</p>
                <p className="text-3xl font-bold">{stats.good}</p>
                <p className="text-xs">320-400W</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card status-average">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Average</p>
                <p className="text-3xl font-bold">{stats.average}</p>
                <p className="text-xs">200-319W</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card status-fault">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Fault</p>
                <p className="text-3xl font-bold">{stats.fault}</p>
                <p className="text-xs">&lt;200W</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comprehensive Tables Overview */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              All Tables Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Table No</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Top Row Panels</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Bottom Row Panels</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Voltage per Panel</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Current per Panel</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Max Power Generating</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Panels</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((table) => {
                    const tablePanels = panels.filter(p => p.tableId === table.id);
                    const topPanelsCount = tablePanels.filter(p => p.position === 'top').length;
                    const bottomPanelsCount = tablePanels.filter(p => p.position === 'bottom').length;
                    const totalPanels = topPanelsCount + bottomPanelsCount;
                    
                    // Get voltage and current from plant details or table data
                    const voltagePerPanel = plantDetails?.voltagePerPanel || 20; // Default fallback
                    const currentPerPanel = plantDetails?.currentPerPanel || 10; // Default fallback
                    const maxPowerPerPanel = voltagePerPanel * currentPerPanel;
                    const maxTotalPower = maxPowerPerPanel * totalPanels;
                    
                    return (
                      <tr key={table.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-primary">{table.serialNumber}</td>
                        <td className="py-3 px-4">{topPanelsCount}</td>
                        <td className="py-3 px-4">{bottomPanelsCount}</td>
                        <td className="py-3 px-4">{voltagePerPanel}V</td>
                        <td className="py-3 px-4">{currentPerPanel}A</td>
                        <td className="py-3 px-4 font-semibold text-green-600">{maxTotalPower}W</td>
                        <td className="py-3 px-4 font-medium">{totalPanels}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant={editingTableId === table.id ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => toggleEditMode(table.id)}
                              className="h-8"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              {editingTableId === table.id ? 'Exit Edit' : 'Edit'}
                            </Button>
                            {editingTableId === table.id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteTable(table)}
                                className="h-8"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {tables.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No tables found</p>
                  <p className="text-sm">Create your first table to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Individual Table Details - Collapsible */}
        {tables.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Individual Table Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Click on individual panels to view detailed information. Use Edit mode to delete panels.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tables and Panels */}
        {tables.map((table) => {
          const tablePanels = panels.filter(p => p.tableId === table.id);
          const topPanels = tablePanels.filter(p => p.position === 'top').sort((a, b) => {
            if (!a.name || !b.name) return 0;
            const aNum = parseInt(a.name.substring(1)) || 0;
            const bNum = parseInt(b.name.substring(1)) || 0;
            return aNum - bNum;
          });
          const bottomPanels = tablePanels.filter(p => p.position === 'bottom').sort((a, b) => {
            if (!a.name || !b.name) return 0;
            const aNum = parseInt(a.name.substring(1)) || 0;
            const bNum = parseInt(b.name.substring(1)) || 0;
            return aNum - bNum;
          });
          
          return (
            <Card key={table.id} className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    {table.serialNumber}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {tablePanels.length} panels ({topPanels.length} top, {bottomPanels.length} bottom)
                    </Badge>
                    <div className="flex gap-2">
                      {editingTableId === table.id && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTable(table)}
                          className="h-8"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete Table
                        </Button>
                      )}
                      <Button
                        variant={editingTableId === table.id ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => toggleEditMode(table.id)}
                        className="h-8"
                      >
                        {editingTableId === table.id ? (
                          <>
                            <Edit className="h-3 w-3 mr-1" />
                            Exit Edit
                          </>
                        ) : (
                          <>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Top Panels Row */}
                <div className="mb-4">
                  <div className="text-sm font-semibold text-muted-foreground mb-2">
                    Top Panels
                    {editingTableId === table.id && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Edit Mode - Click panels to delete
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {topPanels.map((panel) => (
                      <div
                        key={panel.id}
                        className={`relative transition-all hover:scale-105 cursor-pointer rounded-md border border-gray-300 bg-white shadow-sm ${
                          editingTableId === table.id ? 'ring-2 ring-red-500 ring-opacity-50' : ''
                        } ${panel.status === 'fault' ? 'bg-red-100 border-red-300' : ''}`}
                        onClick={() => handlePanelClick(panel, table.id)}
                        style={{
                          width: '32px',
                          height: '40px',
                          borderRadius: '6px'
                        }}
                      >
                        <img
                          src={getPanelImage(panel)}
                          alt={`Panel ${panel.name} - Health ${getPanelHealthPercentage(panel)}%`}
                          className="w-full h-full object-cover"
                          style={{ borderRadius: '4px' }}
                        />
                        {/* Edit mode indicator */}
                        {editingTableId === table.id && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs p-0.5 rounded-full">
                            <Trash2 className="h-2 w-2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Separator Line */}
                <div className="relative my-4">
                  <div className="h-px bg-blue-300"></div>
                </div>

                {/* Bottom Panels Row */}
                <div>
                  <div className="text-sm font-semibold text-muted-foreground mb-2">
                    Bottom Panels
                    {editingTableId === table.id && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Edit Mode - Click panels to delete
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {bottomPanels.map((panel) => (
                      <div
                        key={panel.id}
                        className={`relative transition-all hover:scale-105 cursor-pointer rounded-md border border-gray-300 bg-white shadow-sm ${
                          editingTableId === table.id ? 'ring-2 ring-red-500 ring-opacity-50' : ''
                        } ${panel.status === 'fault' ? 'bg-red-100 border-red-300' : ''}`}
                        onClick={() => handlePanelClick(panel, table.id)}
                        style={{
                          width: '32px',
                          height: '40px',
                          borderRadius: '6px'
                        }}
                      >
                        <img
                          src={getPanelImage(panel)}
                          alt={`Panel ${panel.name} - Health ${getPanelHealthPercentage(panel)}%`}
                          className="w-full h-full object-cover"
                          style={{ borderRadius: '4px' }}
                        />
                        {/* Edit mode indicator */}
                        {editingTableId === table.id && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs p-0.5 rounded-full">
                            <Trash2 className="h-2 w-2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {tables.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No tables found. Add your first table to get started.</p>
            </CardContent>
          </Card>
        )}
          </div>

          {/* Fault Details Sidebar */}
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

            {/* Summary */}
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
          </div>
        </div>
      </main>

      {/* Delete Panel Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Panel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete panel <strong>{panelToDelete?.name}</strong>? 
              This action cannot be undone and will permanently remove the panel from the table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeletePanel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePanel}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Panel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Table Confirmation Dialog */}
      <AlertDialog open={showDeleteTableDialog} onOpenChange={setShowDeleteTableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entire Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete table <strong>{tableToDelete?.serialNumber}</strong>? 
              This action cannot be undone and will permanently remove:
              <br />
              • The entire table
              <br />
              • All panels in this table ({tableToDelete ? panels.filter(p => p.tableId === tableToDelete.id).length : 0} panels)
              <br />
              • Table numbers will be automatically rearranged
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteTable}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTable}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ViewTables;
