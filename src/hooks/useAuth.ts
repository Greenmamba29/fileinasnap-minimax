import { useState, useEffect } from 'react';
import { useNeonAuth, getCurrentUser } from '../lib/neon-auth';

// Compatibility interface to match Supabase User type
interface UserCompat {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    role?: string;
  };
}

export function useAuth() {
  const [user, setUser] = useState<UserCompat | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: neonUser, loading: neonLoading } = useNeonAuth();

  useEffect(() => {
    if (!neonLoading) {
      if (neonUser) {
        // Convert Neon user to Supabase-compatible format
        const compatUser: UserCompat = {
          id: neonUser.id,
          email: neonUser.email,
          user_metadata: {
            full_name: neonUser.full_name,
            role: neonUser.role
          }
        };
        setUser(compatUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, [neonUser, neonLoading]);

  return { user, loading };
}
