import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user (includes demo users)
    async function getInitialUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser as User);
      setLoading(false);
    }

    getInitialUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          // Check for demo user when no session
          const demoUser = await getCurrentUser();
          setUser(demoUser as User);
        }
        setLoading(false);
      }
    );

    // Also listen for demo user changes
    const handleStorageChange = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser as User);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { user, loading };
}
