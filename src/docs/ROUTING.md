# Routing System Documentation

## Overview

The PM Solar Plant Monitor application uses a robust routing system built on React Router with comprehensive protection, navigation guards, and error handling.

## Architecture

### Core Components

1. **ProtectedRoute** (`src/components/routing/ProtectedRoute.tsx`)
   - Handles authentication and authorization
   - Supports role-based access control
   - Redirects unauthorized users

2. **RouteGuard** (`src/components/routing/RouteGuard.tsx`)
   - Global navigation monitoring
   - Session validation
   - Automatic redirects for invalid states

3. **NavigationManager** (`src/components/routing/NavigationManager.tsx`)
   - Handles browser navigation events
   - Deep linking validation
   - Navigation utilities injection

4. **ErrorBoundary** (`src/components/routing/ErrorBoundary.tsx`)
   - Route-level error handling
   - Graceful error recovery
   - Development error details

### Navigation Hook

**useNavigation** (`src/hooks/useNavigation.ts`)
```typescript
const {
  goToLogin,
  goToDashboard,
  goBack,
  logoutAndRedirect,
  isCurrentRoute,
  canAccessRoute,
  navigateWithAuth
} = useNavigation();
```

## Route Configuration

### Public Routes
- `/` - Login page (Welcome)
- `/404` - Not found page

### Protected Routes
- `/dashboard` - Role-based dashboard
  - Super Admin: Company management
  - Plant Admin: Plant monitoring and user management
  - User: Plant monitoring only

## Security Features

### Authentication Protection
```typescript
<ProtectedRoute requireAuth={true}>
  <Dashboard />
</ProtectedRoute>
```

### Role-Based Access
```typescript
<ProtectedRoute 
  requireAuth={true} 
  allowedRoles={['superadmin', 'plantadmin']}
>
  <AdminPanel />
</ProtectedRoute>
```

### Navigation Guards
- Automatic redirect for unauthenticated users
- Session validation on route changes
- Browser navigation handling
- Deep link protection

## Error Handling

### Route-Level Errors
- Error boundaries catch routing errors
- Graceful fallback UI
- Development error details
- Automatic error logging

### 404 Handling
- Custom 404 page with navigation options
- Context-aware home button
- Debug information in development
- Proper error logging

## Usage Examples

### Basic Navigation
```typescript
import { useNavigation } from '@/hooks/useNavigation';

const MyComponent = () => {
  const { goToDashboard, isCurrentRoute } = useNavigation();
  
  return (
    <button 
      onClick={goToDashboard}
      disabled={isCurrentRoute('/dashboard')}
    >
      Go to Dashboard
    </button>
  );
};
```

### Protected Navigation
```typescript
const { navigateWithAuth } = useNavigation();

// Only allows navigation if user has required role
const success = navigateWithAuth('/admin', ['superadmin']);
```

### Route Checking
```typescript
const { canAccessRoute, isProtectedRoute } = useNavigation();

if (canAccessRoute(['plantadmin', 'user'])) {
  // User can access this feature
}

if (isProtectedRoute()) {
  // Current route requires authentication
}
```

## Configuration

### Route Definitions
Routes are defined in `src/config/routes.ts`:

```typescript
export const ROUTES = {
  LOGIN: {
    path: '/',
    requireAuth: false
  },
  DASHBOARD: {
    path: '/dashboard',
    requireAuth: true
  }
};
```

### Route Constants
Centralized route paths in `src/constants/routes.ts`:

```typescript
export const ROUTE_PATHS = {
  HOME: '/',
  DASHBOARD: '/dashboard'
};
```

## Best Practices

### 1. Always Use Navigation Hook
```typescript
// ✅ Good
const { goToDashboard } = useNavigation();
goToDashboard();

// ❌ Avoid
navigate('/dashboard');
```

### 2. Protect Sensitive Routes
```typescript
// ✅ Good
<ProtectedRoute requireAuth={true} allowedRoles={['admin']}>
  <AdminPanel />
</ProtectedRoute>

// ❌ Avoid
<AdminPanel />
```

### 3. Handle Loading States
```typescript
// ✅ Good
if (!user) {
  return <LoadingSpinner />;
}

// ❌ Avoid
// No loading state
```

### 4. Use Route Constants
```typescript
// ✅ Good
import { ROUTE_PATHS } from '@/constants/routes';
navigate(ROUTE_PATHS.DASHBOARD);

// ❌ Avoid
navigate('/dashboard');
```

## Debugging

### Console Logging
The routing system provides comprehensive logging:
- Route access attempts
- Authentication checks
- Navigation events
- Error occurrences

### Development Tools
- Error boundary shows stack traces
- 404 page shows debug information
- Route guard logs navigation attempts

## Future Enhancements

### Planned Features
1. **Breadcrumb Navigation**
2. **Route Transitions**
3. **Deep Link Sharing**
4. **Route Preloading**
5. **Navigation Analytics**

### Extensibility
The routing system is designed to be easily extensible:
- Add new route types
- Implement custom guards
- Add navigation middleware
- Integrate with state management
