import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vuekwckknfjivjighhfd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZWt3Y2trbmZqaXZqaWdoaGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTczNTcsImV4cCI6MjA2Nzk5MzM1N30.9NqjmpF9qqaTALfP2VAAii13vjZTI9IKOf_CSRT9lbo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// Helper functions
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}