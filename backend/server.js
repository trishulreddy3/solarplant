const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create companies directory if it doesn't exist
const COMPANIES_DIR = path.join(__dirname, 'companies');

async function ensureCompaniesDir() {
  try {
    await fs.access(COMPANIES_DIR);
  } catch {
    await fs.mkdir(COMPANIES_DIR, { recursive: true });
    console.log('Created companies directory');
  }
}

// Initialize companies directory
ensureCompaniesDir();

// API Routes

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get all companies
app.get('/api/companies', async (req, res) => {
  try {
    const companies = [];
    const entries = await fs.readdir(COMPANIES_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const companyPath = path.join(COMPANIES_DIR, entry.name);
        const plantDetailsPath = path.join(companyPath, 'plant_details.json');
        
        try {
          const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
          const plantDetails = JSON.parse(plantDetailsData);
          
          companies.push({
            id: entry.name,
            name: plantDetails.companyName,
            folderPath: companyPath,
            createdAt: plantDetails.createdAt,
            plantPowerKW: plantDetails.plantPowerKW,
            voltagePerPanel: plantDetails.voltagePerPanel,
            currentPerPanel: plantDetails.currentPerPanel,
            totalTables: plantDetails.tables.length,
          });
        } catch (error) {
          console.error(`Error reading company ${entry.name}:`, error);
        }
      }
    }
    
    res.json(companies);
  } catch (error) {
    console.error('Error reading companies:', error);
    res.status(500).json({ error: 'Failed to read companies' });
  }
});

// Create company folder
app.post('/api/companies', async (req, res) => {
  try {
    const { companyId, companyName, voltagePerPanel, currentPerPanel, plantPowerKW, adminEmail, adminPassword, adminName } = req.body;
    
    const companyPath = path.join(COMPANIES_DIR, companyId);
    
    // Create company directory
    await fs.mkdir(companyPath, { recursive: true });
    
    const powerPerPanel = voltagePerPanel * currentPerPanel;
    const createdAt = new Date().toISOString();
    
    // Create admin.json file
    const adminData = {
      email: adminEmail,
      password: adminPassword,
      name: adminName,
      createdAt: createdAt
    };
    await fs.writeFile(path.join(companyPath, 'admin.json'), JSON.stringify(adminData, null, 2));
    
    // Create users.json file
    const usersData = [{
      id: `user-${Date.now()}`,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      createdAt: createdAt,
      createdBy: 'super_admin'
    }];
    await fs.writeFile(path.join(companyPath, 'users.json'), JSON.stringify(usersData, null, 2));
    
    // Create plant_details.json file
    const plantDetailsData = {
      companyId: companyId,
      companyName: companyName,
      voltagePerPanel: voltagePerPanel,
      currentPerPanel: currentPerPanel,
      powerPerPanel: powerPerPanel,
      plantPowerKW: plantPowerKW,
      tables: [],
      createdAt: createdAt,
      lastUpdated: createdAt
    };
    await fs.writeFile(path.join(companyPath, 'plant_details.json'), JSON.stringify(plantDetailsData, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Company folder created successfully',
      companyPath: companyPath 
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company folder' });
  }
});

// Add table to company
app.post('/api/companies/:companyId/tables', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { panelsTop, panelsBottom } = req.body;
    
    const companyPath = path.join(COMPANIES_DIR, companyId);
    const plantDetailsPath = path.join(companyPath, 'plant_details.json');
    
    // Read current plant details
    const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
    const plantDetails = JSON.parse(plantDetailsData);
    
    // Generate realistic panel data
    const generatePanelData = (panelCount, voltagePerPanel, currentPerPanel) => {
      const voltage = [];
      const current = [];
      const power = [];
      
      for (let i = 0; i < panelCount; i++) {
        const voltageVariation = voltagePerPanel * (0.95 + Math.random() * 0.1);
        const currentVariation = currentPerPanel * (0.9 + Math.random() * 0.2);
        
        const actualVoltage = Math.round(voltageVariation * 10) / 10;
        const actualCurrent = Math.round(currentVariation * 10) / 10;
        const actualPower = Math.round(actualVoltage * actualCurrent * 10) / 10;
        
        voltage.push(actualVoltage);
        current.push(actualCurrent);
        power.push(actualPower);
      }
      
      return { voltage, current, power };
    };
    
    const tableNumber = plantDetails.tables.length + 1;
    const serialNumber = `TBL-${String(tableNumber).padStart(4, '0')}`;
    
    const topPanelData = generatePanelData(panelsTop, plantDetails.voltagePerPanel, plantDetails.currentPerPanel);
    const bottomPanelData = generatePanelData(panelsBottom, plantDetails.voltagePerPanel, plantDetails.currentPerPanel);
    
    const newTable = {
      id: `table-${Date.now()}`,
      serialNumber: serialNumber,
      panelsTop: panelsTop,
      panelsBottom: panelsBottom,
      createdAt: new Date().toISOString(),
      topPanels: topPanelData,
      bottomPanels: bottomPanelData,
    };
    
    plantDetails.tables.push(newTable);
    plantDetails.lastUpdated = new Date().toISOString();
    
    // Update plant_details.json
    await fs.writeFile(plantDetailsPath, JSON.stringify(plantDetails, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Table added successfully',
      table: newTable 
    });
  } catch (error) {
    console.error('Error adding table:', error);
    res.status(500).json({ error: 'Failed to add table' });
  }
});

// Add user to company
app.post('/api/companies/:companyId/users', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { email, password, role, createdBy } = req.body;
    
    const companyPath = path.join(COMPANIES_DIR, companyId);
    const usersPath = path.join(companyPath, 'users.json');
    
    // Read current users
    const usersData = await fs.readFile(usersPath, 'utf8');
    const users = JSON.parse(usersData);
    
    // Add new user
    const newUser = {
      id: `user-${Date.now()}`,
      email: email,
      password: password,
      role: role,
      createdAt: new Date().toISOString(),
      createdBy: createdBy
    };
    
    users.push(newUser);
    
    // Update users.json
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
    
    res.json({ 
      success: true, 
      message: 'User added successfully',
      user: newUser 
    });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Get company plant details
app.get('/api/companies/:companyId/plant-details', async (req, res) => {
  try {
    const { companyId } = req.params;
    const companyPath = path.join(COMPANIES_DIR, companyId);
    const plantDetailsPath = path.join(companyPath, 'plant_details.json');
    
    const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
    const plantDetails = JSON.parse(plantDetailsData);
    
    res.json(plantDetails);
  } catch (error) {
    console.error('Error reading plant details:', error);
    res.status(500).json({ error: 'Failed to read plant details' });
  }
});

// Get company users
app.get('/api/companies/:companyId/users', async (req, res) => {
  try {
    const { companyId } = req.params;
    const companyPath = path.join(COMPANIES_DIR, companyId);
    const usersPath = path.join(companyPath, 'users.json');
    
    const usersData = await fs.readFile(usersPath, 'utf8');
    const users = JSON.parse(usersData);
    
    res.json(users);
  } catch (error) {
    console.error('Error reading users:', error);
    res.status(500).json({ error: 'Failed to read users' });
  }
});

// Get company admin
app.get('/api/companies/:companyId/admin', async (req, res) => {
  try {
    const { companyId } = req.params;
    const companyPath = path.join(COMPANIES_DIR, companyId);
    const adminPath = path.join(companyPath, 'admin.json');
    
    const adminData = await fs.readFile(adminPath, 'utf8');
    const admin = JSON.parse(adminData);
    
    res.json(admin);
  } catch (error) {
    console.error('Error reading admin:', error);
    res.status(500).json({ error: 'Failed to read admin' });
  }
});

// Delete company folder
app.delete('/api/companies/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const companyPath = path.join(COMPANIES_DIR, companyId);
    
    // Remove directory and all contents
    await fs.rm(companyPath, { recursive: true, force: true });
    
    res.json({ 
      success: true, 
      message: 'Company folder deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company folder' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`File system server running on http://localhost:${PORT}`);
  console.log(`Companies directory: ${COMPANIES_DIR}`);
});

