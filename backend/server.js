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

// Enhanced JSON parsing with error handling
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('Invalid JSON received:', buf.toString());
      throw new Error('Invalid JSON format');
    }
  }
}));

// Global error handler for JSON parsing errors
app.use((error, req, res, next) => {
  if (error.message === 'Invalid JSON format') {
    console.error('JSON parsing error:', error.message);
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      message: 'Please check your request body format'
    });
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('JSON parsing error:', error.message);
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      message: 'Please check your request body format'
    });
  }
  next(error);
});

// Set environment based on PORT
const COMPANIES_DIR = path.join(__dirname, 'companies');

// Helper function to find company folder by companyId
async function findCompanyFolder(companyId) {
  try {
    const companies = await fs.readdir(COMPANIES_DIR);
    
    for (const folderName of companies) {
      const companyPath = path.join(COMPANIES_DIR, folderName);
      const stat = await fs.stat(companyPath);
      
      if (stat.isDirectory()) {
        const plantDetailsPath = path.join(companyPath, 'plant_details.json');
        
        try {
          const plantData = await fs.readFile(plantDetailsPath, 'utf8');
          const plant = JSON.parse(plantData);
          
          if (plant.companyId === companyId) {
            return companyPath;
          }
        } catch (error) {
          // Skip this folder if plant details can't be read
          continue;
        }
      }
    }
    
    return null; // Company not found
  } catch (error) {
    console.error('Error finding company folder:', error);
    return null;
  }
}

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
            } else if (currentState === 'repairing' && currentHealth >= 20 && currentHealth < 80) {
              // Gradually repair repairing panels (increase health by 3-7% per cycle)
              currentHealth += 3 + Math.random() * 4;
            }
            
            // Determine state based on current health
            if (currentHealth < 20) {
              currentState = 'fault';
            } else if (currentHealth < 80) {
              currentState = 'repairing';
            } else {
              currentState = 'good';
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
    
    // Calculate the actual current for this panel based on health multiplier
    // The current is reduced based on the panel's health condition (perfect/repairing/fault)
    const seriesLimitedCurrent = currentPerPanel * currentMultiplier;
    
    // Round current to 1 decimal place for realistic precision
    const actualCurrent = Math.round(seriesLimitedCurrent * 10) / 10;
    
    // Calculate power using P = V × I formula, rounded to 1 decimal place
    const actualPower = Math.round(actualVoltage * actualCurrent * 10) / 10;
    
    // Store the calculated values in arrays for this panel
    voltage.push(actualVoltage);
    current.push(actualCurrent);
    power.push(actualPower);
    
    // Apply series connection logic - all panels FROM the faulty panel onwards show the same visual state
    if (actualFaultyIndex !== null && i >= actualFaultyIndex) {
      // Update visual state for all panels from faulty panel onwards
      panelStates[i] = panelStates[actualFaultyIndex];
    }
  }
  
  // Return comprehensive panel data object containing all calculated metrics
  return { 
    // Arrays containing voltage, current, and power values for each panel
    voltage, 
    current, 
    power, 
    
    // Array of health percentages for each individual panel
    health: panelHealth, 
    
    // Array of visual states for each panel (normal, warning, fault, etc.)
    states: panelStates,
    
    // Overall series connection state (healthy, warning, fault)
    seriesState,
    
    // Average health of the entire series, rounded to 1 decimal place
    seriesHealth: Math.round(seriesHealth * 10) / 10,
    
    // Index of the actual faulty panel (null if no fault or weakest panel is still healthy)
    // Only considers it faulty if the weakest panel has health below 80%
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
            id: plant.companyId, // Use the original companyId from plant details
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

// Create new company
app.post('/api/companies', async (req, res) => {
  try {
    const { 
      companyId, 
      companyName, 
      voltagePerPanel, 
      currentPerPanel, 
      plantPowerKW, 
      adminEmail, 
      adminPassword, 
      adminName 
    } = req.body;
    
    // Validate required fields
    if (!companyId || !companyName || !voltagePerPanel || !currentPerPanel || !plantPowerKW || !adminEmail || !adminPassword || !adminName) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Use company name as folder name, sanitized for filesystem
    const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
    const companyPath = path.join(COMPANIES_DIR, sanitizedCompanyName);
    
    // Check if company already exists
    try {
      await fs.access(companyPath);
      return res.status(409).json({ error: 'Company already exists' });
    } catch (error) {
      // Company doesn't exist, continue with creation
    }
    
    // Create company directory
    await fs.mkdir(companyPath, { recursive: true });
    
    // Calculate power per panel
    const powerPerPanel = voltagePerPanel * currentPerPanel;
    
    // Create plant details file
    const plantDetails = {
      companyId,
      companyName,
      voltagePerPanel,
      currentPerPanel,
      powerPerPanel,
      plantPowerKW,
      tables: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.join(companyPath, 'plant_details.json'), 
      JSON.stringify(plantDetails, null, 2)
    );
    
    // Create admin credentials file
    const adminCredentials = {
      email: adminEmail,
      password: adminPassword,
      name: adminName,
      createdAt: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.join(companyPath, 'admin.json'), 
      JSON.stringify(adminCredentials, null, 2)
    );
    
    // Create users file (initially empty)
    await fs.writeFile(
      path.join(companyPath, 'users.json'), 
      JSON.stringify([], null, 2)
    );
    
    res.json({
      success: true,
      message: 'Company created successfully',
      companyPath: companyPath
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Get plant details for a company
app.get('/api/companies/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const companyPath = await findCompanyFolder(companyId);
    
    if (!companyPath) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const plantDetailsPath = path.join(companyPath, 'plant_details.json');
    
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
    const companyPath = await findCompanyFolder(companyId);
    
    if (!companyPath) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const adminPath = path.join(companyPath, 'admin.json');
    
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
    const companyPath = await findCompanyFolder(companyId);
    
    if (!companyPath) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const usersPath = path.join(companyPath, 'users.json');
    
    const usersData = await fs.readFile(usersPath, 'utf8');
    // Add better error handling for JSON parsing
    const users = JSON.parse(usersData.trim());
    
    res.json(users);
  } catch (error) {
    console.error('Error reading users:', error);
    // Return empty array if users.json is corrupted instead of 500 error
    res.json([]);
  }
});

// Add user to company
app.post('/api/companies/:companyId/users', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { email, password, role, createdBy } = req.body;
    
    const companyPath = await findCompanyFolder(companyId);
    
    if (!companyPath) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const usersPath = path.join(companyPath, 'users.json');
    
    // Read existing users
    let users = [];
    try {
      const usersData = await fs.readFile(usersPath, 'utf8');
      users = JSON.parse(usersData.trim());
    } catch (error) {
      // If users.json doesn't exist or is corrupted, start with empty array
      users = [];
    }
    
    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      password,
      role,
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'super_admin'
    };
    
    // Add user to array
    users.push(newUser);
    
    // Write back to file
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
    
    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Delete company folder
app.delete('/api/companies/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const companyPath = await findCompanyFolder(companyId);
    
    if (!companyPath) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
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
    
    const companyPath = await findCompanyFolder(companyId);
    
    if (!companyPath) {
      return res.status(404).json({ error: 'Company not found' });
    }
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
    const companyPath = await findCompanyFolder(companyId);
    
    if (!companyPath) {
      return res.status(404).json({ error: 'Company not found' });
    }
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
      if (table.bottomPanels.health) table.bottomPanels.health.splice(panelIndex, 1);
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
    const companyPath = await findCompanyFolder(companyId);
    
    if (!companyPath) {
      return res.status(404).json({ error: 'Company not found' });
    }
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
    
    plantDetails.lastUpdated = new Date().toISOString();
    
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

// Add panels to existing table
app.post('/api/companies/:companyId/tables/:tableId/add-panels', async (req, res) => {
  try {
    const { companyId, tableId } = req.params;
    const { position, panelCount } = req.body; // position: 'top' or 'bottom', panelCount: number
    
    const companyPath = await findCompanyFolder(companyId);
    
    if (!companyPath) {
      return res.status(404).json({ error: 'Company not found' });
    }
    const plantDetailsPath = path.join(companyPath, 'plant_details.json');
    
    // Read current plant details
    const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
    const plantDetails = JSON.parse(plantDetailsData);
    
    // Find the table
    const table = plantDetails.tables.find(t => t.id === tableId);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    // Generate new panel data for the additional panels
    const newPanelData = generatePanelData(panelCount, plantDetails.voltagePerPanel, plantDetails.currentPerPanel);
    
    if (position === 'top') {
      // Add to top panels
      table.panelsTop += panelCount;
      
      // Merge new panel data with existing top panels
      if (table.topPanels) {
        // Extend existing arrays
        Object.keys(newPanelData).forEach(key => {
          if (Array.isArray(table.topPanels[key])) {
            table.topPanels[key] = [...table.topPanels[key], ...newPanelData[key]];
          } else {
            table.topPanels[key] = newPanelData[key];
          }
        });
      } else {
        table.topPanels = newPanelData;
      }
    } else if (position === 'bottom') {
      // Add to bottom panels
      table.panelsBottom += panelCount;
      
      // Merge new panel data with existing bottom panels
      if (table.bottomPanels) {
        // Extend existing arrays
        Object.keys(newPanelData).forEach(key => {
          if (Array.isArray(table.bottomPanels[key])) {
            table.bottomPanels[key] = [...table.bottomPanels[key], ...newPanelData[key]];
          } else {
            table.bottomPanels[key] = newPanelData[key];
          }
        });
      } else {
        table.bottomPanels = newPanelData;
      }
    }
    
    plantDetails.lastUpdated = new Date().toISOString();
    
    // Save updated plant details
    await fs.writeFile(plantDetailsPath, JSON.stringify(plantDetails, null, 2));
    
    res.json({ 
      success: true, 
      message: `${panelCount} panel(s) added to ${position} side`,
      tableId: table.id,
      position,
      panelCount,
      updatedAt: plantDetails.lastUpdated
    });
  } catch (error) {
    console.error('Error adding panels:', error);
    res.status(500).json({ error: 'Failed to add panels' });
  }
});

// User authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, companyName } = req.body;
    
    // Validate required fields
    if (!email || !password || !companyName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Email, password, and company name are required' 
      });
    }
    
    // Validate field types
    if (typeof email !== 'string' || typeof password !== 'string' || typeof companyName !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid field types',
        message: 'All fields must be strings' 
      });
    }
    
    const sanitizedCompanyName = companyName.toLowerCase().trim();
    
    // Find company by name
    const companyPath = await findCompanyFolderByName(sanitizedCompanyName);
    if (!companyPath) {
      return res.status(404).json({ 
        error: 'Company not found',
        message: `Company "${sanitizedCompanyName}" does not exist` 
      });
    }
    
    // Check admin credentials first
    const adminPath = path.join(companyPath, 'admin.json');
    try {
      const adminData = await fs.readFile(adminPath, 'utf8');
      const admin = JSON.parse(adminData);
      
      if (admin.email === email && admin.password === password) {
        return res.json({
          success: true,
          user: {
            id: `admin-${sanitizedCompanyName}`,
            email: admin.email,
            role: 'plantadmin',
            name: `${sanitizedCompanyName} Admin`,
            companyName: sanitizedCompanyName
          }
        });
      }
    } catch (error) {
      console.error('Error reading admin file:', error);
      // Admin file doesn't exist or is corrupted, continue to check users
    }
    
    // Check user credentials
    const usersPath = path.join(companyPath, 'users.json');
    try {
      const usersData = await fs.readFile(usersPath, 'utf8');
      const users = JSON.parse(usersData.trim());
      
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        return res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name || user.email,
            companyName: sanitizedCompanyName
          }
        });
      }
    } catch (error) {
      console.error('Error reading users file:', error);
    }
    
    res.status(401).json({ 
      error: 'Invalid credentials',
      message: 'Email, password, or company name is incorrect' 
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: 'An internal server error occurred' 
    });
  }
});

// Helper function to find company folder by company name
async function findCompanyFolderByName(companyName) {
  try {
    const companies = await fs.readdir(COMPANIES_DIR);
    
    for (const folderName of companies) {
      const companyPath = path.join(COMPANIES_DIR, folderName);
      const stat = await fs.stat(companyPath);
      
      if (stat.isDirectory()) {
        const plantDetailsPath = path.join(companyPath, 'plant_details.json');
        
        try {
          const plantData = await fs.readFile(plantDetailsPath, 'utf8');
          const plant = JSON.parse(plantData);
          
          if (plant.companyName.toLowerCase() === companyName) {
            return companyPath;
          }
        } catch (error) {
          // Skip this folder if plant details can't be read
          continue;
        }
      }
    }
    
    return null; // Company not found
  } catch (error) {
    console.error('Error finding company folder by name:', error);
    return null;
  }
}

// Password verification endpoint for 2FA delete confirmation
app.post('/api/verify-super-admin-password', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    // For now, using a simple password check
    // In production, this should be hashed and stored securely
    const correctPassword = 'super_admin_password';
    
    if (password === correctPassword) {
      res.json({ 
        success: true, 
        message: 'Password verified successfully' 
      });
    } else {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid password' 
      });
    }
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`File system server running on port ${PORT}`);
  console.log(`Companies directory: ${COMPANIES_DIR}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ PROPER series connection simulation active!`);
});
