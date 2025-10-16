import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AuthTest = () => {
  const [email, setEmail] = useState('super_admin@microsyslogic.com');
  const [password, setPassword] = useState('super_admin_password');
  const [companyName, setCompanyName] = useState('microsyslogic');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testBackendConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://solarplant.onrender.com/api/status');
      const data = await response.json();
      setResult({ type: 'backend', data });
    } catch (error) {
      setResult({ type: 'backend', error: error.message });
    }
    setLoading(false);
  };

  const testCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://solarplant.onrender.com/api/companies');
      const data = await response.json();
      setResult({ type: 'companies', data });
    } catch (error) {
      setResult({ type: 'companies', error: error.message });
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      // Import the login function dynamically
      const { login } = await import('@/lib/auth');
      const result = await login(email, password, companyName);
      setResult({ type: 'login', data: result });
    } catch (error) {
      setResult({ type: 'login', error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container max-w-2xl mx-auto py-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Authentication Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value.toLowerCase())}
                  placeholder="microsyslogic"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="super_admin@microsyslogic.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="super_admin_password"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={testBackendConnection} disabled={loading}>
                Test Backend
              </Button>
              <Button onClick={testCompanies} disabled={loading}>
                Test Companies
              </Button>
              <Button onClick={testLogin} disabled={loading}>
                Test Login
              </Button>
            </div>

            {result && (
              <div className="mt-4 p-4 bg-accent/20 rounded-lg">
                <h3 className="font-semibold mb-2">Result ({result.type}):</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h3 className="font-semibold mb-2">Test Credentials:</h3>
              <p><strong>Super Admin:</strong> super_admin@microsyslogic.com / super_admin_password</p>
              <p><strong>Intel Admin:</strong> karthik@gmail.com / admin123</p>
              <p><strong>Whipro Admin:</strong> harsha@gmail.com / admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthTest;
