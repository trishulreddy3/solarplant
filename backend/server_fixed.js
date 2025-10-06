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
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else {
        return allowed.test(origin);
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Set environment based on PORT
const COMPANIES_DIR = path.join(__dirname, 'companies');

// Panel health states and repair simulation
const PANEL_STATES = {
  GOOD: { min: 80, max: 100, image: 'image1.png', color: 'blue' },
  REPAIRING: { min: 20, max: 79, image: 'image2.png', color: 'orange' },
  FAULT: { min: 0, max: 19, image: 'image3.png', color: 'red' }
};

// Generate realistic panel data with PROPER series connection logic and repair simulation
const generatePanelData = (panelCount, voltagePerPanel, currentPerPanel, existingData = null) => {
  const voltage = [];
  const current = [];
  const power = [];
  const panelHealth = [];
  const panelStates = [];
  
  // Initialize or continue repair process
  if (existingData && existingData.health && existingData.states) {
    // Continue existing repair process - find the actual faulty panel
    let actualFaultyIndex = -1;
    
    for (let i = 0; i < panelCount; i++) {
      let currentHealth = existingData.health[i] || Math.random() * 100;
      let currentState = existingData.states[i] || 'good';
      
      // Identify the actual faulty panel (lowest health that's not good)
      if (currentHealth < 80) {
        if (actualFaultyIndex === -1) {
          actualFaultyIndex = i;
        } else if (currentHealth < panelHealth[actualFaultyIndex]) {
          actualFaultyIndex = i;
        }
      }
      
      // Simulate repair process ONLY for the actual faulty panel
      if (i === actualFaultyIndex && currentHealth < 80) {
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
        }
      } else if (currentState === 'good' && currentHealth >= 80) {
        // Maintain good condition with slight variations for healthy panels
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
  
  // Introduce NEW faults - only ONE panel gets fault per series per cycle
  const hasExistingFault = panelStates.some(state => state === 'fault' || state === 'repairing');
  const allHealthy = panelStates.every(state => state === 'good');
  
  if (allHealthy && Math.random() < 0.3) { // 30% chance to introduce a fault
    // Randomly select ONE panel to become faulty
    const faultyPanelIndex = Math.floor(Math.random() * panelCount);
    
    if (Math.random() < 0.3) {
      // 30% chance of fault (dust, damage, etc.)
      panelHealth[faultyPanelIndex] = Math.random() * 19; // 0-19%
      panelStates[faultyPanelIndex] = 'fault';
    } else {
      // 70% chance of repairing (cleaning, minor issues)
      panelHealth[faultyPanelIndex] = 20 + Math.random() * 59; // 20-79%
      panelStates[faultyPanelIndex] = 'repairing';
    }
  }
  
  // Find the weakest panel (bottleneck in series connection)
  const weakestHealth = Math.min(...panelHealth);
  const weakestState = panelStates[panelHealth.indexOf(weakestHealth)];
  const actualFaultyIndex = panelHealth.indexOf(weakestHealth);
  
  // Apply PROPER series connection logic - all panels FROM the faulty panel onwards show the same status
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
    
    // Update panel state for series connection display - all FROM the faulty panel onwards show the same state
    if (i >= actualFaultyIndex && actualFaultyIndex !== -1 && weakestHealth < 80) {
      // Only update visual state, not the actual health values
      if (i !== actualFaultyIndex) {
        // These panels are visually affected but don't need repair
        panelStates[i] = panelStates[actualFaultyIndex];
      }
    }
  }
  
  return { 
    voltage, 
    current, 
    power, 
    health: panelHealth, 
    states: panelStates,
    seriesState,
    seriesHealth: Math.round(seriesHealth * 10) / 10,
    actualFaultyIndex: actualFaultyIndex !== -1 && weakestHealth < 80 ? actualFaultyIndex : null
  };
};

// Get all companies
app.get('/api/companies', async (req, res) => {
  try {
    const companies = await fs.readdir(COMPANIES_DIR);
    const companyData = [];
    
    for (const companyId of companies) {
      const companyPath = path.join(COMPANIES_DIR, companyId);
      const stat = await fs.stat(companyPath);
      
      if (stat.isDirectory()) {
        const plantDetailsPath = path.join(companyPath, 'plant_details.json');
        
        try {
          const plantData = await fs.readFile(plantDetailsPath, 'utf8');
          const plant = JSON.parse(plantData);
          companyData.push({
            id: companyId,
            name: plant.companyName,
            folderPath: companyPath,
            createdAt: stat.birthtime.toISOString(),
            ...plant
          });
        } catch (error) {
          console.error(`Error reading plant details for ${companyId}:`, error);
        }
      }
    }
    
    res.json(companyData);
  } catch (error) {
    console.error('Error reading companies:', error);
    res.status(500).json({ error: 'Failed to read companies' });
  }
});

// Get plant details for a company
app.get('/api/companies/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const plantDetailsPath = path.join(COMPANIES_DIR, companyId, 'plant_details.json');
    
    const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
    const plantDetails = JSON.parse(plantDetailsData);
    
    res.json(plantDetails);
  } catch (error) {
    console.error('Error reading plant details:', error);
    res.status(500).json({ error: 'Failed to read plant details' });
  }
});

// Get admin credentials
app.get('/api/companies/:companyId/admin', async (req, res) => {
  try {
    const { companyId } = req.params;
    const adminPath = path.join(COMPANIES_DIR, companyId, 'admin.json');
    
    const adminData = await fs.readFile(adminPath, 'utf8');
    const admin = JSON.parse(adminData);
    
    res.json(admin);
  } catch (error) {
    console.error('Error reading admin:', error);
    res.status(500).json({ error: 'Failed to read admin data' });
  }
});

// Get users
app.get('/api/companies/:companyId/users', async (req, res) => {
  try {
    const { companyId } = req.params;
    const usersPath = path.join(COMPANIES_DIR, companyId, 'users.json');
    
    const usersData = await fs.readFile(usersPath, 'utf8');
    const users = JSON.parse(usersData);
    
    res.json(users);
  } catch (error) {
    console.error('Error reading users:', error);
    res.status(500).json({ error: 'Failed to read users' });
  }
});

// Delete company folder
app.delete('/api/companies/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const companyPath = path.join(COMPANIES_DIR, companyId);
    
    await fs.rm(companyPath, { recursive: true, force: true });
    
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// Create new table
app.post('/api/companies/:companyId/tables', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { panelsTop, panelsBottom } = req.body;
    
    const companyPath = path.join(COMPANIES_DIR, companyId);
    const plantDetailsPath = path.join(companyPath, 'plant_details.json');
    
    // Read current plant details
    const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
    const plantDetails = JSON.parse(plantDetailsData);
    
    const tableNumber = plantDetails.tables.length + 1;
    const serialNumber = `TBL-${String(tableNumber).padStart(4, '0')}`;
    
    const topPanelData = generatePanelData(panelsTop, plantDetails.voltagePerPanel, plantDetails.currentPerPanel);
    const bottomPanelData = generatePanelData(panelsBottom, plantDetails.voltagePerPanel, plantDetails.currentPerPanel);
    
    const newTable = {
      id: `table-${Date.now()}`,
      serialNumber,
      panelsTop,
      panelsBottom,
      createdAt: new Date().toISOString(),
      topPanels: topPanelData,
      bottomPanels: bottomPanelData
    };
    
    plantDetails.tables.push(newTable);
    plantDetails.lastUpdated = new Date().toISOString();
    
    // Save updated plant details
    await fs.writeFile(plantDetailsPath, JSON.stringify(plantDetails, null, 2));
    
    res.json({
      success: true,
      message: 'Table created successfully',
      table: newTable
    });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
});

// Delete panel
app.delete('/api/companies/:companyId/tables/:tableId/panels/:panelId', async (req, res) => {
  try {
    const { companyId, tableId, panelId } = req.params;
    const companyPath = path.join(COMPANIES_DIR, companyId);
    const plantDetailsPath = path.join(companyPath, 'plant_details.json');
    
    // Read current plant details
    const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
    const plantDetails = JSON.parse(plantDetailsData);
    
    const tableIndex = plantDetails.tables.findIndex(table => table.id === tableId);
    if (tableIndex === -1) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    const table = plantDetails.tables[tableIndex];
    
    // Parse panel ID to determine position and index
    const panelIdParts = panelId.split('-');
    const position = panelIdParts[panelIdParts.length - 2]; // top or bottom
    const panelIndex = parseInt(panelIdParts[panelIdParts.length - 1]); // panel number
    
    if (position === 'top') {
      table.topPanels.voltage.splice(panelIndex, 1);
      table.topPanels.current.splice(panelIndex, 1);
      table.topPanels.power.splice(panelIndex, 1);
      if (table.topPanels.health) table.topPanels.health.splice(panelIndex, 1);
      if (table.topPanels.states) table.topPanels.states.splice(panelIndex, 1);
      table.panelsTop -= 1;
    } else if (position === 'bottom') {
      table.bottomPanels.voltage.splice(panelIndex, 1);
      table.bottomPanels.current.splice(panelIndex, 1);
      table.bottomPanels.power.splice(panelIndex, 1);
      if (table.bottomPanels.health) table.bottomPanELS.health.splice(panelIndex, 1);
      if (table.bottomPanels.states) table.bottomPanels.states.splice(panelIndex, 1);
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

// Refresh panel data for dynamic updates with PROPER repair simulation
app.put('/api/companies/:companyId/refresh-panel-data', async (req, res) => {
  try {
    const { companyId } = req.params;
    const companyPath = path.join(COMPANIES_DIR, companyId);
    const plantDetailsPath = path.join(companyPath, 'plant_details.json');
    
    // Read current plant details
    const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
    const plantDetails = JSON.parse(plantDetailsData);
    
    // Update panel data for all tables with PROPER repair simulation
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
    
    plantDetails.lastUpdated = new Date().toISOISOString();
    
    // Save updated data
    await fs.writeFile(plantDetailsPath, JSON.stringify(plantDetails, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Panel data refreshed with PROPER repair simulation',
      updatedAt: plantDetails.lastUpdated,
      tables: plantDetails.tables.length,
      simulation: 'proper-series-connection'
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
  console.log(`✅ PROPER series connection simulation active!`);
});

