import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { addTable } from '@/lib/data';
import { addTableToPlant, getPlantDetails } from '@/lib/realFileSystem';
import { validateUserCompany } from '@/lib/companySync';
import { useToast } from '@/hooks/use-toast';

const AddTable = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getCurrentUser();
  const [formData, setFormData] = useState({
    panelsTop: '',
    panelsBottom: '',
  });

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

    const panelsTop = parseInt(formData.panelsTop);
    const panelsBottom = parseInt(formData.panelsBottom);

    if (panelsTop < 0 || panelsBottom < 0) {
      toast({
        title: 'Invalid Input',
        description: 'Number of panels must be positive',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Validate user's company exists in backend
      const validation = await validateUserCompany();
      if (!validation.isValid) {
        toast({
          title: 'Company Validation Error',
          description: validation.message || 'Your company is not properly configured in the backend system.',
          variant: 'destructive',
        });
        return;
      }

      // Add table to company plant details file with realistic power arrays
      const plantTableResult = await addTableToPlant(user.companyId, panelsTop, panelsBottom);
      
      // Also add to legacy system for compatibility
      const table = addTable(user.companyId, panelsTop, panelsBottom, user.email);

      // Get plant details to show power information
      const plantDetails = await getPlantDetails(user.companyId);
      const powerPerPanel = plantDetails?.powerPerPanel || 0;

      toast({
        title: 'Success!',
        description: `Table ${table.serialNumber} created with ${panelsTop + panelsBottom} panels (${powerPerPanel}W per panel)`,
      });

      navigate('/infrastructure');
    } catch (error) {
      console.error('Error creating table:', error);
      toast({
        title: 'Error',
        description: 'Failed to create table. The company may not exist in the backend system. Please contact the super admin.',
        variant: 'destructive',
      });
    }
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
          onClick={() => navigate('/infrastructure')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Infrastructure
        </Button>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Plus className="h-6 w-6 text-primary" />
              Add New Table
            </CardTitle>
            <CardDescription>
              Configure panel layout for the new table. Serial number will be generated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="panelsTop">Number of Panels (Top Row)</Label>
                  <Input
                    id="panelsTop"
                    type="number"
                    min="0"
                    value={formData.panelsTop}
                    onChange={(e) => setFormData({ ...formData, panelsTop: e.target.value })}
                    placeholder="10"
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panelsBottom">Number of Panels (Bottom Row)</Label>
                  <Input
                    id="panelsBottom"
                    type="number"
                    min="0"
                    value={formData.panelsBottom}
                    onChange={(e) => setFormData({ ...formData, panelsBottom: e.target.value })}
                    placeholder="10"
                    required
                    className="h-12"
                  />
                </div>

                {formData.panelsTop && formData.panelsBottom && (
                  <div className="p-4 bg-accent/20 rounded-lg border border-accent">
                    <p className="text-sm font-semibold">Total Panels</p>
                    <p className="text-3xl font-bold text-primary">
                      {parseInt(formData.panelsTop || '0') + parseInt(formData.panelsBottom || '0')}
                    </p>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full h-12 gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Create Table
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddTable;
