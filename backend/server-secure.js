const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

// Import security middleware
const {
  securityHeaders,
  generalLimiter,
  authLimiter,
  apiLimiter,
  validateLogin,
  validateUserCreation,
  validateCompanyCreation,
  sanitizeInput,
  securityLogger
} = require('./middleware/security');

// Import utilities
const { hashPassword, comparePassword, generateSecurePassword } = require('./utils/passwordUtils');
const { 
  authenticateToken, 
  requireRole, 
  requireCompanyAccess, 
  generateTokenPair,
  generateSessionData 
} = require('./utils/jwtUtils');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware (applied first)
app.use(securityHeaders);
app.use(securityLogger);
app.use(sanitizeInput);

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [
          'http://localhost:8080',
          'http://localhost:8081', 
          'http://localhost:5173',
          /\.netlify\.app$/,
          /\.onrender\.com$/
        ];
    
    if (!origin) return callback(null, true);
    
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
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secure-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000 // 24 hours
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use(generalLimiter);

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
    // Continue existing simulation
    for (let i = 0; i < panelCount; i++) {
      const currentHealth = existingData.health[i] || 100;
      const currentState = existingData.states[i] || 'good';
      
      // Gradually increase health for repairing panels
      if (currentState === 'repairing' && currentHealth < 100) {
        panelHealth[i] = Math.min(100, currentHealth + Math.random() * 5);
      } else {
        panelHealth[i] = currentHealth;
      }
      
      // Determine state based on health
      if (panelHealth[i] >= 80) {
        panelStates[i] = 'good';
      } else if (panelHealth[i] >= 20) {
        panelStates[i] = 'repairing';
      } else {
        panelStates[i] = 'fault';
      }
    }
  } else {
    // Initialize new panel data (start with good condition)
    for (let i = 0; i < panelCount; i++) {
      panelHealth[i] = 85 + Math.random() * 15; // 85-100% health
      panelStates[i] = 'good';
    }
  }

  // Randomly introduce faults (5% chance per panel per cycle)
  for (let i = 0; i < panelCount; i++) {
    if (Math.random() < 0.05 && panelStates[i] === 'good') {
      panelHealth[i] = Math.random() * 20; // 0-20% health (fault)
      panelStates[i] = 'fault';
    }
  }

  // Find the weakest panel (bottleneck in series connection)
  let weakestHealth = 100;
  let weakestState = 'good';
  let actualFaultyIndex = null;

  for (let i = 0; i < panelCount; i++) {
    if (panelHealth[i] < weakestHealth) {
      weakestHealth = panelHealth[i];
      weakestState = panelStates[i];
      actualFaultyIndex = i;
    }
  }

  // Apply series connection logic - all panels FROM the faulty panel onwards show the same visual state
  for (let i = 0; i < panelCount; i++) {
    // Calculate voltage (should be consistent in series)
    voltage[i] = voltagePerPanel * (0.95 + Math.random() * 0.1); // 95-105% of expected
    
    // Current is limited by the weakest panel in series
    if (actualFaultyIndex !== null && i >= actualFaultyIndex) {
      // All panels from the faulty one onwards show reduced current
      current[i] = currentPerPanel * (weakestHealth / 100);
      panelStates[i] = weakestState; // Visual state propagation
    } else {
      current[i] = currentPerPanel * (0.95 + Math.random() * 0.1); // 95-105% of expected
    }
    
    power[i] = voltage[i] * current[i];
  }

  // Calculate series health (overall string health)
  const seriesHealth = weakestHealth;
  const seriesState = weakestState;

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

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Authentication endpoints
app.post('/api/auth/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check Super Admin (hardcoded for now - should be moved to database)
    if (email === 'admin@pm.com' && password === 'superadmin123') {
      const user = {
        id: 'super-admin-1',
        email: 'admin@pm.com',
        role: 'super_admin',
        companyName: 'Microsyslogic',
        createdAt: new Date().toISOString()
      };
      
      const sessionData = generateSessionData(user);
      req.session.user = sessionData;
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyName: user.companyName
        },
        tokens: {
          accessToken: sessionData.accessToken,
          refreshToken: sessionData.refreshToken,
          expiresIn: sessionData.expiresIn
        }
      });
      return;
    }

    // Check company admins and users
    const companies = await fs.readdir(COMPANIES_DIR);
    
    for (const companyId of companies) {
      try {
        // Check admin credentials
        const adminPath = path.join(COMPANIES_DIR, companyId, 'admin.json');
        const adminData = await fs.readFile(adminPath, 'utf8');
        const admin = JSON.parse(adminData);
        
        if (admin.email === email && await comparePassword(password, admin.password)) {
          const user = {
            id: `admin-${companyId}`,
            email: admin.email,
            role: 'plant_admin',
            companyId: companyId,
            companyName: admin.companyName
          };
          
          const sessionData = generateSessionData(user);
          req.session.user = sessionData;
          
          res.json({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              companyId: user.companyId,
              companyName: user.companyName
            },
            tokens: {
              accessToken: sessionData.accessToken,
              refreshToken: sessionData.refreshToken,
              expiresIn: sessionData.expiresIn
            }
          });
          return;
        }
        
        // Check user credentials
        const usersPath = path.join(COMPANIES_DIR, companyId, 'users.json');
        const usersData = await fs.readFile(usersPath, 'utf8');
        const users = JSON.parse(usersData);
        
        const user = users.find(u => u.email === email);
        if (user && await comparePassword(password, user.password)) {
          const userObj = {
            id: user.id,
            email: user.email,
            role: 'user',
            companyId: companyId,
            companyName: admin.companyName
          };
          
          const sessionData = generateSessionData(userObj);
          req.session.user = sessionData;
          
          res.json({
            success: true,
            user: {
              id: userObj.id,
              email: userObj.email,
              role: userObj.role,
              companyId: userObj.companyId,
              companyName: userObj.companyName
            },
            tokens: {
              accessToken: sessionData.accessToken,
              refreshToken: sessionData.refreshToken,
              expiresIn: sessionData.expiresIn
            }
          });
          return;
        }
      } catch (error) {
        console.error(`Error checking company ${companyId}:`, error);
        continue;
      }
    }
    
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Get all companies (protected)
app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const companies = [];
    const companyDirs = await fs.readdir(COMPANIES_DIR);
    
    for (const companyId of companyDirs) {
      try {
        const companyPath = path.join(COMPANIES_DIR, companyId);
        const stats = await fs.stat(companyPath);
        
        if (stats.isDirectory()) {
          const adminPath = path.join(companyPath, 'admin.json');
          const adminData = await fs.readFile(adminPath, 'utf8');
          const admin = JSON.parse(adminData);
          
          const plantDetailsPath = path.join(companyPath, 'plant_details.json');
          let plantDetails = null;
          
          try {
            const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
            plantDetails = JSON.parse(plantDetailsData);
          } catch (error) {
            // Plant details might not exist yet
          }
          
          companies.push({
            id: companyId,
            name: admin.companyName,
            folderPath: companyPath,
            createdAt: admin.createdAt,
            companyId: companyId,
            companyName: admin.companyName,
            voltagePerPanel: plantDetails?.voltagePerPanel || 20,
            currentPerPanel: plantDetails?.currentPerPanel || 10,
            powerPerPanel: (plantDetails?.voltagePerPanel || 20) * (plantDetails?.currentPerPanel || 10),
            plantPowerKW: plantDetails?.plantPowerKW || 1000,
            tables: plantDetails?.tables || [],
            lastUpdated: plantDetails?.lastUpdated || new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error reading company ${companyId}:`, error);
        continue;
      }
    }
    
    res.json(companies);
  } catch (error) {
    console.error('Error reading companies:', error);
    res.status(500).json({ error: 'Failed to read companies' });
  }
});

// Get company details (protected with company access)
app.get('/api/companies/:companyId', authenticateToken, requireCompanyAccess, async (req, res) => {
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

// Get company admin (protected with company access)
app.get('/api/companies/:companyId/admin', authenticateToken, requireCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const adminPath = path.join(COMPANIES_DIR, companyId, 'admin.json');
    
    const adminData = await fs.readFile(adminPath, 'utf8');
    const admin = JSON.parse(adminData);
    
    // Don't return password hash
    delete admin.password;
    
    res.json(admin);
  } catch (error) {
    console.error('Error reading admin data:', error);
    res.status(500).json({ error: 'Failed to read admin data' });
  }
});

// Get users for a company (protected with company access)
app.get('/api/companies/:companyId/users', authenticateToken, requireCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const usersPath = path.join(COMPANIES_DIR, companyId, 'users.json');
    
    const usersData = await fs.readFile(usersPath, 'utf8');
    const users = JSON.parse(usersData.trim());
    
    // Don't return password hashes
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Error reading users:', error);
    res.json([]);
  }
});

// Add user to company (protected with admin role and company access)
app.post('/api/companies/:companyId/users', 
  authenticateToken, 
  requireRole(['super_admin', 'plant_admin']), 
  requireCompanyAccess,
  validateUserCreation,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { email, password, role, createdBy } = req.body;
      
      const usersPath = path.join(COMPANIES_DIR, companyId, 'users.json');
      
      // Read existing users
      let users = [];
      try {
        const usersData = await fs.readFile(usersPath, 'utf8');
        users = JSON.parse(usersData.trim());
      } catch (error) {
        users = [];
      }
      
      // Check if user already exists
      if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create new user
      const newUser = {
        id: `user-${Date.now()}`,
        email,
        password: hashedPassword,
        role,
        createdAt: new Date().toISOString(),
        createdBy: createdBy || req.user.email
      };
      
      // Add user to array
      users.push(newUser);
      
      // Write back to file
      await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
      
      // Don't return password hash
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
      console.error('Error adding user:', error);
      res.status(500).json({ error: 'Failed to add user' });
    }
  }
);

// Add table to company (protected with admin role and company access)
app.post('/api/companies/:companyId/tables', 
  authenticateToken, 
  requireRole(['super_admin', 'plant_admin']), 
  requireCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { panelsTop, panelsBottom } = req.body;
      
      // Validate input
      if (!panelsTop || !panelsBottom || panelsTop < 1 || panelsBottom < 1) {
        return res.status(400).json({ error: 'Invalid panel counts' });
      }
      
      const plantDetailsPath = path.join(COMPANIES_DIR, companyId, 'plant_details.json');
      
      // Read existing plant details
      let plantDetails;
      try {
        const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
        plantDetails = JSON.parse(plantDetailsData);
      } catch (error) {
        // Create new plant details if they don't exist
        plantDetails = {
          voltagePerPanel: 20,
          currentPerPanel: 10,
          plantPowerKW: 1000,
          tables: []
        };
      }
      
      // Create new table
      const newTable = {
        id: `table-${Date.now()}`,
        serialNumber: `TBL-${String(plantDetails.tables.length + 1).padStart(4, '0')}`,
        panelsTop,
        panelsBottom,
        createdAt: new Date().toISOString(),
        topPanels: generatePanelData(panelsTop, plantDetails.voltagePerPanel, plantDetails.currentPerPanel),
        bottomPanels: generatePanelData(panelsBottom, plantDetails.voltagePerPanel, plantDetails.currentPerPanel)
      };
      
      // Add table to plant details
      plantDetails.tables.push(newTable);
      plantDetails.lastUpdated = new Date().toISOString();
      
      // Write back to file
      await fs.writeFile(plantDetailsPath, JSON.stringify(plantDetails, null, 2));
      
      res.json({ success: true, table: newTable });
    } catch (error) {
      console.error('Error adding table:', error);
      res.status(500).json({ error: 'Failed to add table' });
    }
  }
);

// Delete panel from table (protected with admin role and company access)
app.delete('/api/companies/:companyId/tables/:tableId/panels/:panelId', 
  authenticateToken, 
  requireRole(['super_admin', 'plant_admin']), 
  requireCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, tableId, panelId } = req.params;
      
      const plantDetailsPath = path.join(COMPANIES_DIR, companyId, 'plant_details.json');
      const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
      const plantDetails = JSON.parse(plantDetailsData);
      
      // Find the table
      const table = plantDetails.tables.find(t => t.id === tableId);
      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
      
      // Parse panel ID to get position and index
      const [position, panelNumber] = panelId.split('-');
      const panelIndex = parseInt(panelNumber) - 1;
      
      if (position === 'top') {
        if (panelIndex >= 0 && panelIndex < table.topPanels.voltage.length) {
          table.topPanels.voltage.splice(panelIndex, 1);
          table.topPanels.current.splice(panelIndex, 1);
          table.topPanels.power.splice(panelIndex, 1);
          if (table.topPanels.health) table.topPanels.health.splice(panelIndex, 1);
          if (table.topPanels.states) table.topPanels.states.splice(panelIndex, 1);
          table.panelsTop -= 1;
        } else {
          return res.status(400).json({ error: 'Invalid panel index' });
        }
      } else if (position === 'bottom') {
        if (panelIndex >= 0 && panelIndex < table.bottomPanels.voltage.length) {
          table.bottomPanels.voltage.splice(panelIndex, 1);
          table.bottomPanels.current.splice(panelIndex, 1);
          table.bottomPanels.power.splice(panelIndex, 1);
          if (table.bottomPanels.health) table.bottomPanels.health.splice(panelIndex, 1);
          if (table.bottomPanels.states) table.bottomPanels.states.splice(panelIndex, 1);
          table.panelsBottom -= 1;
        } else {
          return res.status(400).json({ error: 'Invalid panel index' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid panel position' });
      }
      
      // Update plant details
      plantDetails.lastUpdated = new Date().toISOString();
      
      // Write back to file
      await fs.writeFile(plantDetailsPath, JSON.stringify(plantDetails, null, 2));
      
      res.json({ success: true, message: 'Panel deleted successfully' });
    } catch (error) {
      console.error('Error deleting panel:', error);
      res.status(500).json({ error: 'Failed to delete panel' });
    }
  }
);

// Refresh panel data (protected with company access)
app.put('/api/companies/:companyId/refresh-panel-data', 
  authenticateToken, 
  requireCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const plantDetailsPath = path.join(COMPANIES_DIR, companyId, 'plant_details.json');
      
      const plantDetailsData = await fs.readFile(plantDetailsPath, 'utf8');
      const plantDetails = JSON.parse(plantDetailsData);
      
      // Update panel data for all tables
      for (const table of plantDetails.tables) {
        table.topPanels = generatePanelData(
          table.panelsTop, 
          plantDetails.voltagePerPanel, 
          plantDetails.currentPerPanel,
          table.topPanels
        );
        
        table.bottomPanels = generatePanelData(
          table.panelsBottom, 
          plantDetails.voltagePerPanel, 
          plantDetails.currentPerPanel,
          table.bottomPanels
        );
      }
      
      plantDetails.lastUpdated = new Date().toISOString();
      
      // Write back to file
      await fs.writeFile(plantDetailsPath, JSON.stringify(plantDetails, null, 2));
      
      res.json({ success: true, plantDetails });
    } catch (error) {
      console.error('Error refreshing panel data:', error);
      res.status(500).json({ error: 'Failed to refresh panel data' });
    }
  }
);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 Secure Solar Plant Monitor Server running on port ${PORT}`);
  console.log(`📁 Companies directory: ${COMPANIES_DIR}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ PROPER series connection simulation active!`);
  console.log(`🛡️ Security middleware enabled`);
  console.log(`🔐 JWT authentication enabled`);
  console.log(`⚡ Rate limiting enabled`);
});





