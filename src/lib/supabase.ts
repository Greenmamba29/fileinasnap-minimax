import { createClient } from '@supabase/supabase-js';

// Use environment variables for configuration - pointing to Neon DB
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://neon-proxy.fileinasnap.com';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Neon database connection
export const DATABASE_URL = import.meta.env.VITE_DATABASE_URL || 'postgresql://neondb_owner:npg_3XzoWY0khMAD@ep-cool-salad-aejesikb-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Database type definitions
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  tier: 'free' | 'pro' | 'veteran' | 'agency' | 'standard';
  is_admin: boolean;
  enable_sound_fx: boolean;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  user_id: string;
  name: string;
  path: string;
  size_bytes: number;
  mime_type: string;
  metadata: Record<string, any>;
  tags: string[];
  category?: string;
  subcategory?: string;
  quarantined: boolean;
  risk_score: number;
  ai_tags?: string[];
  ai_summary?: string;
  custom_metadata?: Record<string, any>;
  media_type?: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
  created_at: string;
  updated_at: string;
}

export interface FileActivity {
  id: string;
  file_id: string;
  user_id: string;
  user_name: string;
  activity_type: 'file_created' | 'file_updated' | 'metadata_updated' | 'ai_insights_updated' | 'file_moved' | 'file_shared' | 'file_downloaded' | 'tags_updated';
  details: Record<string, any>;
  created_at: string;
  file_name?: string;
}

export interface DashboardStats {
  total_files: number;
  total_size: number;
  recent_files: number;
  media_files: number;
  document_files: number;
}

// Demo test users for Neon DB testing
const TEST_USERS = [
  { 
    id: '11111111-1111-1111-1111-111111111111', 
    email: 'admin@fileinasnap.com', 
    password: 'admin123!', 
    role: 'admin',
    full_name: 'Admin User'
  },
  { 
    id: '22222222-2222-2222-2222-222222222222', 
    email: 'testuser@fileinasnap.com', 
    password: 'test123!', 
    role: 'user',
    full_name: 'Test User'
  },
  { 
    id: '33333333-3333-3333-3333-333333333333', 
    email: 'demo@fileinasnap.com', 
    password: 'demo123!', 
    role: 'user',
    full_name: 'Demo User'
  }
];

// Helper functions
export async function getCurrentUser() {
  // Check for demo user first
  const demoUser = getDemoUser();
  if (demoUser) {
    return {
      id: demoUser.id,
      email: demoUser.email,
      user_metadata: { full_name: demoUser.full_name, role: demoUser.role }
    };
  }

  // Fallback to Supabase auth
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
}

export async function signOut() {
  // Clear demo user
  localStorage.removeItem('demo_user');
  // Also sign out from Supabase
  return await supabase.auth.signOut();
}

export async function signIn(email: string, password: string) {
  // Check if it's a test user first
  const testUser = TEST_USERS.find(u => u.email === email && u.password === password);
  
  if (testUser) {
    // Store test user for demo purposes
    localStorage.setItem('demo_user', JSON.stringify({
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      full_name: testUser.full_name
    }));
    
    return {
      data: {
        user: {
          id: testUser.id,
          email: testUser.email,
          user_metadata: { full_name: testUser.full_name, role: testUser.role }
        }
      },
      error: null
    };
  }
  
  // Fallback to Supabase auth for other users
  return await supabase.auth.signInWithPassword({ email, password });
}

function getDemoUser() {
  try {
    const stored = localStorage.getItem('demo_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
