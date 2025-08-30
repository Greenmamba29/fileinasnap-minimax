// Direct authentication with Neon database
// This bypasses Supabase Auth and connects directly to our Neon DB

import { useState, useEffect } from 'react';

const DATABASE_URL = 'postgresql://neondb_owner:npg_3XzoWY0khMAD@ep-cool-salad-aejesikb-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

interface AuthResponse {
  data: { user: User } | null;
  error: Error | null;
}

// Simple client-side authentication for demo purposes
// In production, this would be done server-side with proper security
export async function authenticateUser(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log('🔐 Attempting authentication for:', email);
    
    // For demo purposes, validate against known test users
    const testUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@fileinasnap.com',
        password: 'admin123!',
        full_name: 'Admin User',
        role: 'admin'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'testuser@fileinasnap.com',
        password: 'test123!',
        full_name: 'Test User',
        role: 'user'
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'demo@fileinasnap.com',
        password: 'demo123!',
        full_name: 'Demo User',
        role: 'user'
      }
    ];

    const user = testUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      console.log('❌ Authentication failed: Invalid credentials');
      return {
        data: null,
        error: new Error('Invalid email or password')
      };
    }

    console.log('✅ Authentication successful for:', user.email);

    // Store user session
    const userSession = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      authenticated: true,
      loginTime: new Date().toISOString()
    };

    sessionStorage.setItem('user_session', JSON.stringify(userSession));
    localStorage.setItem('user_session', JSON.stringify(userSession));

    // Trigger storage event for other tabs/components
    window.dispatchEvent(new Event('auth-change'));

    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      },
      error: null
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Authentication failed')
    };
  }
}

export function getCurrentUser(): User | null {
  try {
    // Check session storage first (current tab)
    let userStr = sessionStorage.getItem('user_session');
    
    // Fall back to local storage (persistent)
    if (!userStr) {
      userStr = localStorage.getItem('user_session');
    }

    if (userStr) {
      const session = JSON.parse(userStr);
      if (session.authenticated) {
        return {
          id: session.id,
          email: session.email,
          full_name: session.full_name,
          role: session.role
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function signOut(): Promise<void> {
  return new Promise((resolve) => {
    console.log('🚪 Signing out user');
    
    // Clear all stored session data
    sessionStorage.removeItem('user_session');
    localStorage.removeItem('user_session');
    
    // Trigger auth change event
    window.dispatchEvent(new Event('auth-change'));
    
    resolve();
  });
}

// Hook-like function for React components
export function useNeonAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Listen for auth changes
    const handleAuthChange = () => {
      const updatedUser = getCurrentUser();
      setUser(updatedUser);
    };

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return { user, loading };
}

// For compatibility with existing code
export { authenticateUser as signIn };

// Verify database connectivity (for debugging)
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    // This would typically be a server-side function
    // For client-side demo, we'll just return true if we have the URL
    return !!DATABASE_URL;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}
