// Real file system operations using backend API
// This creates actual physical folders and files on the system

const API_BASE_URL = 'http://localhost:5000/api';

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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
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
  return await apiCall(`/companies/${companyId}/plant-details`);
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
  try {
    await apiCall('/companies');
    return true;
  } catch {
    return false;
  }
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

