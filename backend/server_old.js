const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from Netlify, localhost, and no origin (mobile apps, Postman)
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:5173',
      /\.netlify\.app$/,  // Any Netlify subdomain
      /\.onrender\.com$/  // Any Render subdomain
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(null, true); // For now, allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
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
    
    // Panel health states and repair simulation
    const PANEL_STATES = {
      GOOD: { min: 80, max: 100, image: 'image1.png', color: 'blue' },
      REPAIRING: { min: 20, max: 79, image: 'image2.png', color: 'orange' },
      FAULT: { min: 0, max: 19, image: 'image3.png', color: 'red' }
    };

    // Generate realistic panel data with series connection logic and repair simulation
    const generatePanelData = (panelCount, voltagePerPanel, currentPerPanel, existingData = null) => {
      const voltage = [];
      const current = [];
      const power = [];
      const panelHealth = [];
      const panelStates = [];
      
      // Initialize or continue repair process
      if (existingData && existingData.health && existingData.states) {
        // Continue existing repair process
        for (let i = 0; i < panelCount; i++) {
          let currentHealth = existingData.health[i] || Math.random() * 100;
          let currentState = existingData.states[i] || 'good';
          
          // Simulate repair process
          if (currentState === 'fault' && currentHealth < 20) {
            // Gradually repair fault panels (increase health by 2-5% per cycle)
            currentHealth += 2 + Math.random() * 3;
            if (currentHealth >= 20) {
              currentState = 'repairing';
            }
          } else if (currentState === 'repairing' && currentHealth < 80) {
            // Gradually repair repairing panels (increase health by 3-7% per cycle)
            currentHealth += 3 + Math.random() * 4;
            if (currentHealth >= 80) {
              currentState = 'good';
            }
          } else if (currentState === 'good' && currentHealth >= 80) {
            // Maintain good condition with slight variations
            currentHealth = Math.max(80, Math.min(100, currentHealth + (Math.random() - 0.5) * 2));
          }
          
          panelHealth.push(Math.round(currentHealth * 10) / 10);
          panelStates.push(currentState);
        }
      } else {
        // Initialize new panel data
        for (let i = 0; i < panelCount; i++) {
          // Start with good condition (80-100% health)
          const health = 80 + Math.random() * 20;
          panelHealth.push(Math.round(health * 10) / 10);
          panelStates.push('good');
        }
      }
      
      // Randomly introduce faults (5% chance per panel per cycle)
      const allHealthy = panelStates.every(state => state === 'good');
      
      // Introduce random faults/repairing conditions
      for (let i = 0; i < panelCount; i++) {
        if (panelStates[i] === 'good' && Math.random() < 0.05) { // 5% chance
          if (Math.random() < 0.3) {
            // 30% chance of fault (dust, damage, etc.)
            panelHealth[i] = Math.random() * 19; // 0-19%
            panelStates[i] = 'fault';
          } else {
            // 70% chance of repairing (cleaning, minor issues)
            panelHealth[i] = 20 + Math.random() * 59; // 20-79%
            panelStates[i] = 'repairing';
          }
        }
      }
      
      // Find the weakest panel (bottleneck in series connection)
      const weakestHealth = Math.min(...panelHealth);
      const weakestState = panelStates[panelHealth.indexOf(weakestHealth)];
      
      // Apply series connection logic - all panels show the same status as the weakest
      const seriesState = weakestState;
      const seriesHealth = weakestHealth;
      
      // Generate data for each panel
      for (let i = 0; i < panelCount; i++) {
        // Voltage varies slightly per panel (98-102% of nominal)
        const voltageVariation = voltagePerPanel * (0.98 + Math.random() * 0.04);
        const actualVoltage = Math.round(voltageVariation * 10) / 10;
        
        // Current is limited by the weakest panel in series
        let currentMultiplier;
        if (seriesHealth >= 80) {
          // Perfect health: 95-100% current
          currentMultiplier = 0.95 + Math.random() * 0.05;
        } else if (seriesHealth >= 20) {
          // Repairing mode: 20-80% current based on health
          currentMultiplier = 0.2 + (seriesHealth / 100) * 0.6;
        } else {
          // Fault condition: 5-20% current
          currentMultiplier = 0.05 + (seriesHealth / 100) * 0.15;
        }
        
        const seriesLimitedCurrent = currentPerPanel * currentMultiplier;
        const actualCurrent = Math.round(seriesLimitedCurrent * 10) / 10;
        const actualPower = Math.round(actualVoltage * actualCurrent * 10) / 10;
        
        voltage.push(actualVoltage);
        current.push(actualCurrent);
        power.push(actualPower);
      }
      
      return { 
        voltage, 
        current, 
        power, 
        health: panelHealth, 
        states: panelStates,
        seriesState,
        seriesHealth: Math.round(seriesHealth * 10) / 10
      };
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

// Delete panel from table
app.delete('/api/companies/:companyId/tables/:tableId/panels/:panelId', async (req, res) => {
  try {
    const { companyId, tableId, panelId } = req.params;
    const companyPath = path.join(COMPANIES_DIR, companyId);
    const plantDetailsPath = path.join(companyPath, 'plant_details.json');
    
    // Read current plant details
    const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
    const plantDetails = JSON.parse(plantDetailsData);
    
    // Find the table
    const tableIndex = plantDetails.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    const table = plantDetails.tables[tableIndex];
    
    // Extract panel position and index from panelId (format: tableId-top/bottom-index)
    const panelIdParts = panelId.split('-');
    const position = panelIdParts[panelIdParts.length - 2]; // 'top' or 'bottom'
    const panelIndex = parseInt(panelIdParts[panelIdParts.length - 1]); // panel number
    
    if (position === 'top') {
      table.topPanels.voltage.splice(panelIndex, 1);
      table.topPanels.current.splice(panelIndex, 1);
      table.topPanels.power.splice(panelIndex, 1);
      table.panelsTop -= 1;
    } else if (position === 'bottom') {
      table.bottomPanels.voltage.splice(panelIndex, 1);
      table.bottomPanels.current.splice(panelIndex, 1);
      table.bottomPanels.power.splice(panelIndex, 1);
      table.panelsBottom -= 1;
    } else {
      return res.status(400).json({ error: 'Invalid panel position' });
    }
    
    // Update plant details
    plantDetails.tables[tableIndex] = table;
    plantDetails.lastUpdated = new Date().toISOString();
    
    // Save updated data
    await fs.writeFile(plantDetailsPath, JSON.stringify(plantDetails, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Panel deleted successfully',
      updatedTable: table 
    });
  } catch (error) {
    console.error('Error deleting panel:', error);
    res.status(500).json({ error: 'Failed to delete panel' });
  }
});

// Refresh panel data for dynamic updates with repair simulation
app.put('/api/companies/:companyId/refresh-panel-data', async (req, res) => {
  try {
    const { companyId } = req.params;
    const companyPath = path.join(COMPANIES_DIR, companyId);
    const plantDetailsPath = path.join(companyPath, 'plant_details.json');
    
    // Read current plant details
    const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
    const plantDetails = JSON.parse(plantDetailsData);
    
    // Panel health states and repair simulation
    const PANEL_STATES = {
      GOOD: { min: 80, max: 100, image: 'image1.png', color: 'blue' },
      REPAIRING: { min: 20, max: 79, image: 'image2.png', color: 'orange' },
      FAULT: { min: 0, max: 19, image: 'image3.png', color: 'red' }
    };

    // Generate realistic panel data with series connection logic and repair simulation
    const generatePanelData = (panelCount, voltagePerPanel, currentPerPanel, existingData = null) => {
      const voltage = [];
      const current = [];
      const power = [];
      const panelHealth = [];
      const panelStates = [];
      
      // Initialize or continue repair process
      if (existingData && existingData.health && existingData.states) {
        // Continue existing repair process
        for (let i = 0; i < panelCount; i++) {
          let currentHealth = existingData.health[i] || Math.random() * 100;
          let currentState = existingData.states[i] || 'good';
          
          // Simulate repair process
          if (currentState === 'fault' && currentHealth < 20) {
            // Gradually repair fault panels (increase health by 2-5% per cycle)
            currentHealth += 2 + Math.random() * 3;
            if (currentHealth >= 20) {
              currentState = 'repairing';
            }
          } else if (currentState === 'repairing' && currentHealth < 80) {
            // Gradually repair repairing panels (increase health by 3-7% per cycle)
            currentHealth += 3 + Math.random() * 4;
            if (currentHealth >= 80) {
              currentState = 'good';
            }
          } else if (currentState === 'good' && currentHealth >= 80) {
            // Maintain good condition with slight variations
            currentHealth = Math.max(80, Math.min(100, currentHealth + (Math.random() - 0.5) * 2));
          }
          
          panelHealth.push(Math.round(currentHealth * 10) / 10);
          panelStates.push(currentState);
        }
      } else {
        // Initialize new panel data
        for (let i = 0; i < panelCount; i++) {
          // Start with good condition (80-100% health)
          const health = 80 + Math.random() * 20;
          panelHealth.push(Math.round(health * 10) / 10);
          panelStates.push('good');
        }
      }
      
      // Randomly introduce faults (5% chance per panel per cycle)
      const allHealthy = panelStates.every(state => state === 'good');
      
      // Introduce random faults/repairing conditions
      for (let i = 0; i < panelCount; i++) {
        if (panelStates[i] === 'good' && Math.random() < 0.05) { // 5% chance
          if (Math.random() < 0.3) {
            // 30% chance of fault (dust, damage, etc.)
            panelHealth[i] = Math.random() * 19; // 0-19%
            panelStates[i] = 'fault';
          } else {
            // 70% chance of repairing (cleaning, minor issues)
            panelHealth[i] = 20 + Math.random() * 59; // 20-79%
            panelStates[i] = 'repairing';
          }
        }
      }
      
      // Find the weakest panel (bottleneck in series connection)
      const weakestHealth = Math.min(...panelHealth);
      const weakestState = panelStates[panelHealth.indexOf(weakestHealth)];
      
      // Apply series connection logic - all panels show the same status as the weakest
      const seriesState = weakestState;
      const seriesHealth = weakestHealth;
      
      // Generate data for each panel
      for (let i = 0; i < panelCount; i++) {
        // Voltage varies slightly per panel (98-102% of nominal)
        const voltageVariation = voltagePerPanel * (0.98 + Math.random() * 0.04);
        const actualVoltage = Math.round(voltageVariation * 10) / 10;
        
        // Current is limited by the weakest panel in series
        let currentMultiplier;
        if (seriesHealth >= 80) {
          // Perfect health: 95-100% current
          currentMultiplier = 0.95 + Math.random() * 0.05;
        } else if (seriesHealth >= 20) {
          // Repairing mode: 20-80% current based on health
          currentMultiplier = 0.2 + (seriesHealth / 100) * 0.6;
        } else {
          // Fault condition: 5-20% current
          currentMultiplier = 0.05 + (seriesHealth / 100) * 0.15;
        }
        
        const seriesLimitedCurrent = currentPerPanel * currentMultiplier;
        const actualCurrent = Math.round(seriesLimitedCurrent * 10) / 10;
        const actualPower = Math.round(actualVoltage * actualCurrent * 10) / 10;
        
        voltage.push(actualVoltage);
        current.push(actualCurrent);
        power.push(actualPower);
      }
      
      return { 
        voltage, 
        current, 
        power, 
        health: panelHealth, 
        states: panelStates,
        seriesState,
        seriesHealth: Math.round(seriesHealth * 10) / 10
      };
    };
    
    // Update panel data for all tables with repair simulation
    plantDetails.tables.forEach(table => {
      if (table.panelsTop > 0) {
        const topPanelData = generatePanelData(
          table.panelsTop, 
          plantDetails.voltagePerPanel, 
          plantDetails.currentPerPanel,
          table.topPanels // Pass existing data for repair simulation
        );
        table.topPanels = topPanelData;
      }
      
      if (table.panelsBottom > 0) {
        const bottomPanelData = generatePanelData(
          table.panelsBottom, 
          plantDetails.voltagePerPanel, 
          plantDetails.currentPerPanel,
          table.bottomPanels // Pass existing data for repair simulation
        );
        table.bottomPanels = bottomPanelData;
      }
    });
    
    plantDetails.lastUpdated = new Date().toISOString();
    
    // Save updated data
    await fs.writeFile(plantDetailsPath, JSON.stringify(plantDetails, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Panel data refreshed with repair simulation',
      updatedAt: plantDetails.lastUpdated,
      tables: plantDetails.tables.length,
      simulation: 'active'
    });
  } catch (error) {
    console.error('Error refreshing panel data:', error);
    res.status(500).json({ error: 'Failed to refresh panel data' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`File system server running on port ${PORT}`);
  console.log(`Companies directory: ${COMPANIES_DIR}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

