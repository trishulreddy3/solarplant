import { useEffect } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";

const NotFound = () => {
  const { currentPath, goToLogin, goToDashboard, goBack, isAuthenticated } = useNavigation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", currentPath);
    
    // Log additional context for debugging
    console.log("404 Context:", {
      path: currentPath,
      isAuthenticated,
      timestamp: new Date().toISOString()
    });
  }, [currentPath, isAuthenticated]);

  const handleGoHome = () => {
    if (isAuthenticated) {
      goToDashboard();
    } else {
      goToLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        
        <p className="text-gray-600 mb-2">
          The page you're looking for doesn't exist.
        </p>
        
        <p className="text-sm text-gray-500 mb-6">
          Path: <code className="bg-gray-100 px-2 py-1 rounded">{currentPath}</code>
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={goBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          
          <Button
            onClick={handleGoHome}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            {isAuthenticated ? 'Dashboard' : 'Home'}
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Debug Info:</h3>
            <pre className="text-xs text-gray-600">
              {JSON.stringify({
                path: currentPath,
                authenticated: isAuthenticated,
                timestamp: new Date().toISOString()
              }, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotFound;
