import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/lib/auth';
import UnifiedViewTables from '@/components/UnifiedViewTables';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'user') {
      navigate('/user-login');
      return;
    }
    
    setUser(currentUser);
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-primary">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <UnifiedViewTables
      userRole="user"
    />
  );
};

export default UserDashboard;