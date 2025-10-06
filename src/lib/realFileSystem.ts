// Real file system operations using backend API
// This creates actual physical folders and files on the system

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  
  // Check for custom API URL from environment
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Default to localhost for development
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging
console.log('🔧 API Configuration:', {
  isDev: import.meta.env.DEV,
  viteApiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  resolvedApiBaseUrl: API_BASE_URL
});

export interface CompanyFolder {
  id: string;
  name: string;
  folderPath: string;
  createdAt: string;
  plantPowerKW: number;
  voltagePerPanel: number;
  currentPerPanel: number;
  totalTables: number;
}

export interface AdminCredentials {
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

export interface UserCredentials {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: string;
  createdBy: string;
}

export interface PlantDetails {
  companyId: string;
  companyName: string;
  voltagePerPanel: number;
  currentPerPanel: number;
  powerPerPanel: number;
  plantPowerKW: number;
  tables: PlantTable[];
  createdAt: string;
  lastUpdated: string;
}

export interface PlantTable {
  id: string;
  serialNumber: string;
  panelsTop: number;
  panelsBottom: number;
  createdAt: string;
  topPanels: {
    voltage: number[];
    current: number[];
    power: number[];
  };
  bottomPanels: {
    voltage: number[];
    current: number[];
    power: number[];
  };
}

// API helper function
async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🌐 Making API call to:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log('📡 API response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 API response data:', data);
    return data;
  } catch (error) {
    console.error('❌ API call error:', error);
    throw error;
  }
}

// Get all companies with their folder information
export const getAllCompanies = async (): Promise<CompanyFolder[]> => {
  return await apiCall('/companies');
};

// Create company folder with all necessary files
export const createCompanyFolder = async (
  companyId: string,
  companyName: string,
  voltagePerPanel: number,
  currentPerPanel: number,
  plantPowerKW: number,
  adminEmail: string,
  adminPassword: string,
  adminName: string
): Promise<{ success: boolean; message: string; companyPath: string }> => {
  return await apiCall('/companies', {
    method: 'POST',
    body: JSON.stringify({
      companyId,
      companyName,
      voltagePerPanel,
      currentPerPanel,
      plantPowerKW,
      adminEmail,
      adminPassword,
      adminName,
    }),
  });
};

// Add table to company plant details
export const addTableToPlant = async (
  companyId: string,
  panelsTop: number,
  panelsBottom: number
): Promise<{ success: boolean; message: string; table: PlantTable }> => {
  return await apiCall(`/companies/${companyId}/tables`, {
    method: 'POST',
    body: JSON.stringify({
      panelsTop,
      panelsBottom,
    }),
  });
};

// Add user to company
export const addUserToCompany = async (
  companyId: string,
  email: string,
  password: string,
  role: 'admin' | 'user',
  createdBy: string
): Promise<{ success: boolean; message: string; user: UserCredentials }> => {
  return await apiCall(`/companies/${companyId}/users`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      role,
      createdBy,
    }),
  });
};

// Get plant details for a company
export const getPlantDetails = async (companyId: string): Promise<PlantDetails> => {
  return await apiCall(`/companies/${companyId}`);
};

// Get users for a company
export const getUsers = async (companyId: string): Promise<UserCredentials[]> => {
  return await apiCall(`/companies/${companyId}/users`);
};

// Get admin credentials for a company
export const getAdminCredentials = async (companyId: string): Promise<AdminCredentials> => {
  return await apiCall(`/companies/${companyId}/admin`);
};

// Delete entire company folder
export const deleteCompanyFolder = async (companyId: string): Promise<{ success: boolean; message: string }> => {
  return await apiCall(`/companies/${companyId}`, {
    method: 'DELETE',
  });
};

// Check if backend server is running
export const checkServerStatus = async (): Promise<boolean> => {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Checking server status (attempt ${attempt}/${maxRetries}) at:`, `${API_BASE_URL}/companies`);
      const result = await apiCall('/companies');
      console.log('✅ Server status check successful:', result);
      return true;
    } catch (error) {
      console.error(`❌ Server status check failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error('❌ All server status check attempts failed');
  return false;
};

// Get panel health percentage from plant details
export const getPanelHealthPercentage = (
  plantDetails: PlantDetails,
  tableId: string,
  position: 'top' | 'bottom',
  panelIndex: number
): number => {
  const table = plantDetails.tables.find(t => t.id === tableId);
  if (!table) return 0;

  const panelData = position === 'top' ? table.topPanels : table.bottomPanels;
  const actualPower = panelData.power[panelIndex];
  const expectedPower = plantDetails.powerPerPanel;
  
  return Math.round((actualPower / expectedPower) * 100);
};

// Get panel status based on health percentage
export const getPanelStatus = (healthPercentage: number): 'good' | 'average' | 'fault' => {
  if (healthPercentage >= 100) return 'good';
  if (healthPercentage >= 50) return 'average';
  return 'fault';
};

export const deletePanel = async (companyId: string, panelId: string): Promise<boolean> => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    
    // Extract tableId from panelId (format: tableId-position-index)
    const tableId = panelId.split('-').slice(0, -2).join('-');
    
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/tables/${tableId}/panels/${panelId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete panel: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error deleting panel:', error);
    return false;
  }
};

export const refreshPanelData = async (companyId: string): Promise<boolean> => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/refresh-panel-data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh panel data: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error refreshing panel data:', error);
    return false;
  }
};

// Add panels to existing table
export const addPanels = async (companyId: string, tableId: string, position: 'top' | 'bottom', panelCount: number): Promise<boolean> => {
  try {
    const response = await apiCall(`/companies/${companyId}/tables/${tableId}/add-panels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ position, panelCount }),
    });

    if (response.success) {
      console.log(`✅ Added ${panelCount} panel(s) to ${position} side of table ${tableId}`);
      return true;
    } else {
      console.error('Failed to add panels:', response.error);
      return false;
    }
  } catch (error) {
    console.error('Error adding panels:', error);
    return false;
  }
};

