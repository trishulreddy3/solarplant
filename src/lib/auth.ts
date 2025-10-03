// Client-side authentication utilities
// ⚠️ WARNING: This is for demo purposes only. Use proper backend auth in production.

export type UserRole = 'super_admin' | 'plant_admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  companyName?: string;
  companyId?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  plantPowerKW: number;
  panelVoltage: number;
  panelCurrent: number;
  totalTables: number;
  adminId: string;
  createdAt: string;
}

// Super Admin credentials (hardcoded for demo)
const SUPER_ADMIN = {
  email: 'trishureddy.microsyslogic@gmail.com',
  password: 'superadmin123',
  role: 'super_admin' as UserRole,
  companyName: 'Microsyslogic',
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
};

// Check backend credentials
const checkBackendCredentials = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    // Import the backend functions
    const { getAllCompanies, getAdminCredentials, getUsers } = await import('./realFileSystem');
    
    // Get all companies from backend
    const backendCompanies = await getAllCompanies();
    
    // Check each company for matching credentials
    for (const company of backendCompanies) {
      try {
        // Check admin credentials
        const adminCreds = await getAdminCredentials(company.id);
        if (adminCreds && adminCreds.email === email && adminCreds.password === password) {
          const user: User = {
            id: `admin-${company.id}`,
            email: adminCreds.email,
            role: 'plant_admin',
            companyName: company.name,
            companyId: company.id,
            createdAt: adminCreds.createdAt,
          };
          return { success: true, user };
        }
        
        // Check user credentials
        const users = await getUsers(company.id);
        const foundUser = users.find(u => u.email === email && u.password === password);
        if (foundUser) {
          const user: User = {
            id: foundUser.id,
            email: foundUser.email,
            role: 'user',
            companyName: company.name,
            companyId: company.id,
            createdAt: foundUser.createdAt,
          };
          return { success: true, user };
        }
      } catch (error) {
        // Continue checking other companies if one fails
        console.warn(`Error checking company ${company.id}:`, error);
      }
    }
    
    return { success: false, error: 'Invalid credentials' };
  } catch (error) {
    console.error('Backend credential check failed:', error);
    return { success: false, error: 'Backend authentication failed' };
  }
};

export const login = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    console.log(`🚀 Starting login process for: ${email}`);
    
    // Check Super Admin (hardcoded)
    if (email === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
      console.log('✅ Super admin login successful');
      const user: User = {
        id: 'super-admin-1',
        email: SUPER_ADMIN.email,
        role: 'super_admin',
        companyName: SUPER_ADMIN.companyName,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      return { success: true, user };
    }

    // Check backend credentials first
    console.log('🔍 Checking backend credentials...');
    const backendResult = await checkBackendCredentials(email, password);
    if (backendResult.success) {
      console.log('✅ Backend authentication successful');
      setCurrentUser(backendResult.user);
      return { success: true, user: backendResult.user };
    }
    console.log('❌ Backend authentication failed:', backendResult.error);

    // Skip localStorage fallback - only use backend authentication
    console.log('❌ Backend authentication failed, not falling back to localStorage');
    return { success: false, error: 'Invalid credentials' };
  } catch (error) {
    console.error('❌ Login error:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
};

export const logout = () => {
  setCurrentUser(null);
};

// Company management
export const getCompanies = (): Company[] => {
  const companiesJson = localStorage.getItem('companies');
  return companiesJson ? JSON.parse(companiesJson) : [];
};

export const saveCompanies = (companies: Company[]) => {
  localStorage.setItem('companies', JSON.stringify(companies));
};

export const addCompany = (company: Omit<Company, 'id' | 'createdAt'>): Company => {
  const companies = getCompanies();
  const newCompany: Company = {
    ...company,
    id: `company-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  companies.push(newCompany);
  saveCompanies(companies);
  return newCompany;
};

// Plant Admin management
interface PlantAdmin {
  id: string;
  email: string;
  password: string;
  companyId: string;
  createdAt: string;
}

export const getPlantAdmins = (): PlantAdmin[] => {
  const adminsJson = localStorage.getItem('plantAdmins');
  return adminsJson ? JSON.parse(adminsJson) : [];
};

export const savePlantAdmins = (admins: PlantAdmin[]) => {
  localStorage.setItem('plantAdmins', JSON.stringify(admins));
};

export const addPlantAdmin = (email: string, password: string, companyId: string): PlantAdmin => {
  const admins = getPlantAdmins();
  const newAdmin: PlantAdmin = {
    id: `admin-${Date.now()}`,
    email,
    password,
    companyId,
    createdAt: new Date().toISOString(),
  };
  admins.push(newAdmin);
  savePlantAdmins(admins);
  return newAdmin;
};

// User management
interface StoredUser {
  id: string;
  email: string;
  password: string;
  companyId: string;
  createdAt: string;
}

export const getUsers = (): StoredUser[] => {
  const usersJson = localStorage.getItem('users');
  return usersJson ? JSON.parse(usersJson) : [];
};

export const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem('users', JSON.stringify(users));
};

export const addUser = (email: string, companyId: string): { user: StoredUser; password: string } => {
  const users = getUsers();
  const password = generatePassword();
  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    email,
    password,
    companyId,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return { user: newUser, password };
};

export const deleteUser = (userId: string): boolean => {
  const users = getUsers();
  const updatedUsers = users.filter(user => user.id !== userId);
  if (updatedUsers.length < users.length) {
    saveUsers(updatedUsers);
    return true;
  }
  return false;
};

const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
