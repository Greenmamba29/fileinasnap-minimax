-- FileInASnap Database Schema
-- This script creates all tables and initial data for the FileInASnap application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_category') THEN
    CREATE TYPE file_category AS ENUM ('document', 'image', 'video', 'audio', 'archive', 'other');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analysis_status') THEN
    CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'change_type') THEN
    CREATE TYPE change_type AS ENUM ('created', 'modified', 'renamed', 'moved', 'metadata_changed', 'tags_changed');
  END IF;
END $$;

-- Create auth schema and users table for standalone deployment
CREATE SCHEMA IF NOT EXISTS auth;

-- Basic auth.users table (simplified version of Supabase auth)
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmation_token TEXT,
  recovery_token TEXT,
  email_change_token_new TEXT,
  email_change TEXT,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  raw_app_meta_data JSONB DEFAULT '{}',
  raw_user_meta_data JSONB DEFAULT '{}',
  is_super_admin BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'authenticated'
);

-- Function to get current user ID (simulates auth.uid())
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS UUID 
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.user.id', true), '')
  )::UUID;
$$;

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  category file_category DEFAULT 'other',
  hash_md5 TEXT,
  hash_sha256 TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_folder_id UUID REFERENCES public.files(id),
  is_folder BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  custom_metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  ai_tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  ai_analysis JSONB DEFAULT '{}',
  analysis_status analysis_status DEFAULT 'pending',
  quarantined BOOLEAN DEFAULT FALSE,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  thumbnail_url TEXT,
  preview_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File versions table (for version history)
CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  change_type change_type NOT NULL,
  previous_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Analysis Jobs table
CREATE TABLE IF NOT EXISTS public.ai_analysis_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('analyze_document', 'analyze_image', 'generate_tags', 'detect_duplicates', 'categorize', 'summarize')),
  status analysis_status DEFAULT 'pending',
  provider TEXT DEFAULT 'openrouter',
  model_used TEXT,
  input_data JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Activity Feed table
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared Links table
CREATE TABLE IF NOT EXISTS public.shared_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE,
  password_hash TEXT,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON public.files(category);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_hash_md5 ON public.files(hash_md5);
CREATE INDEX IF NOT EXISTS idx_files_parent_folder ON public.files(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_files_tags ON public.files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_files_ai_tags ON public.files USING GIN(ai_tags);
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON public.file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_file_id ON public.ai_analysis_jobs(file_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON public.ai_analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON public.activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.activity_feed(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Files: Users can manage their own files
CREATE POLICY "Users can view their own files" ON public.files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own files" ON public.files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own files" ON public.files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own files" ON public.files FOR DELETE USING (auth.uid() = user_id);

-- File versions: Users can view versions of their own files
CREATE POLICY "Users can view their file versions" ON public.file_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.files WHERE id = file_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert versions for their files" ON public.file_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.files WHERE id = file_id AND user_id = auth.uid())
);

-- AI Analysis Jobs: Users can manage jobs for their own files
CREATE POLICY "Users can view their AI jobs" ON public.ai_analysis_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert AI jobs" ON public.ai_analysis_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their AI jobs" ON public.ai_analysis_jobs FOR UPDATE USING (auth.uid() = user_id);

-- Activity Feed: Users can view their own activity
CREATE POLICY "Users can view their own activity" ON public.activity_feed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity" ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shared Links: Users can manage links for their own files
CREATE POLICY "Users can view shared links for their files" ON public.shared_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.files WHERE id = file_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create shared links for their files" ON public.shared_links FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.files WHERE id = file_id AND user_id = auth.uid()) AND auth.uid() = created_by
);

-- Insert initial system settings
INSERT INTO public.system_settings (key, value, description) VALUES 
  ('app_version', '"1.0.0"', 'Current application version'),
  ('ai_providers', '{"openrouter": {"enabled": true, "models": ["mistral-7b", "llama-3.1-8b"]}, "minimax": {"enabled": false}}', 'AI provider configuration'),
  ('file_upload_limits', '{"max_size_mb": 100, "allowed_types": ["image/*", "application/pdf", "text/*", "video/*", "audio/*"]}', 'File upload restrictions'),
  ('storage_limits', '{"default_quota_gb": 5, "premium_quota_gb": 100}', 'Storage quota limits')
ON CONFLICT (key) DO NOTHING;

-- Create functions for common operations

-- Function to get file statistics for a user
CREATE OR REPLACE FUNCTION get_user_file_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_files', COUNT(*),
    'total_size_bytes', COALESCE(SUM(size_bytes), 0),
    'by_category', json_object_agg(category, category_count),
    'ai_analyzed', COUNT(*) FILTER (WHERE analysis_status = 'completed'),
    'pending_analysis', COUNT(*) FILTER (WHERE analysis_status = 'pending')
  ) INTO result
  FROM (
    SELECT 
      category,
      size_bytes,
      analysis_status,
      COUNT(*) OVER (PARTITION BY category) as category_count
    FROM public.files 
    WHERE user_id = user_uuid AND is_folder = FALSE
  ) stats;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search files with AI tags
CREATE OR REPLACE FUNCTION search_files(
  search_query TEXT,
  user_uuid UUID,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  path TEXT,
  category file_category,
  ai_summary TEXT,
  tags TEXT[],
  ai_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.path,
    f.category,
    f.ai_summary,
    f.tags,
    f.ai_tags,
    f.created_at,
    ts_rank(to_tsvector('english', f.name || ' ' || COALESCE(f.ai_summary, '') || ' ' || array_to_string(f.tags || f.ai_tags, ' ')), plainto_tsquery('english', search_query)) as rank
  FROM public.files f
  WHERE f.user_id = user_uuid 
    AND f.is_folder = FALSE
    AND (
      f.name ILIKE '%' || search_query || '%' OR
      f.ai_summary ILIKE '%' || search_query || '%' OR
      search_query = ANY(f.tags) OR
      search_query = ANY(f.ai_tags) OR
      to_tsvector('english', f.name || ' ' || COALESCE(f.ai_summary, '') || ' ' || array_to_string(f.tags || f.ai_tags, ' ')) @@ plainto_tsquery('english', search_query)
    )
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth';
COMMENT ON TABLE public.files IS 'File metadata and AI analysis results';
COMMENT ON TABLE public.file_versions IS 'Version history for files';
COMMENT ON TABLE public.ai_analysis_jobs IS 'AI processing job queue and results';
COMMENT ON TABLE public.activity_feed IS 'User activity tracking';
COMMENT ON TABLE public.shared_links IS 'Public file sharing links';
COMMENT ON TABLE public.system_settings IS 'Application configuration';
