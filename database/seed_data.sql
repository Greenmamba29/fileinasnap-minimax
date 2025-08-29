-- Seed Data for FileInASnap
-- This script creates test users and sample data for immediate testing

-- First, we need to create test users in the auth schema (this would normally be done via Supabase Auth)
-- For testing purposes, we'll insert directly into auth.users

-- Note: In a real Supabase environment, users would be created through the Auth API
-- This is for local/testing setup only

-- Insert test users into auth.users (if running locally)
-- In production, these would be created via Supabase Auth signup

DO $$
DECLARE
    admin_user_id UUID := '11111111-1111-1111-1111-111111111111';
    test_user_id UUID := '22222222-2222-2222-2222-222222222222';
    demo_user_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- Insert test users into auth.users (only if table exists and is empty)
    -- This is primarily for local development
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        -- Admin user
        INSERT INTO auth.users (
            id, email, encrypted_password, email_confirmed_at, 
            created_at, updated_at, confirmation_token, recovery_token
        ) VALUES (
            admin_user_id,
            'admin@fileinasnap.com',
            crypt('admin123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            encode(gen_random_bytes(32), 'hex'),
            encode(gen_random_bytes(32), 'hex')
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Test user
        INSERT INTO auth.users (
            id, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, confirmation_token, recovery_token
        ) VALUES (
            test_user_id,
            'testuser@fileinasnap.com',
            crypt('test123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            encode(gen_random_bytes(32), 'hex'),
            encode(gen_random_bytes(32), 'hex')
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Demo user
        INSERT INTO auth.users (
            id, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, confirmation_token, recovery_token
        ) VALUES (
            demo_user_id,
            'demo@fileinasnap.com',
            crypt('demo123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            encode(gen_random_bytes(32), 'hex'),
            encode(gen_random_bytes(32), 'hex')
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Create profiles for test users
    INSERT INTO public.profiles (id, email, full_name, role, preferences) VALUES
        (
            admin_user_id,
            'admin@fileinasnap.com',
            'Admin User',
            'admin',
            '{"theme": "dark", "language": "en", "notifications": true}'
        ),
        (
            test_user_id,
            'testuser@fileinasnap.com',
            'Test User',
            'user',
            '{"theme": "light", "language": "en", "notifications": false}'
        ),
        (
            demo_user_id,
            'demo@fileinasnap.com',
            'Demo User',
            'user',
            '{"theme": "system", "language": "en", "notifications": true}'
        )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        preferences = EXCLUDED.preferences,
        updated_at = NOW();

    -- Create sample folders for test users
    INSERT INTO public.files (
        id, name, path, size_bytes, mime_type, category, user_id, 
        is_folder, metadata, ai_summary, analysis_status
    ) VALUES
        -- Admin user folders
        (uuid_generate_v4(), 'Documents', '/Documents', 0, 'application/folder', 'other', admin_user_id, true, '{"created_by": "system"}', 'System folder for documents', 'completed'),
        (uuid_generate_v4(), 'Media', '/Media', 0, 'application/folder', 'other', admin_user_id, true, '{"created_by": "system"}', 'System folder for media files', 'completed'),
        (uuid_generate_v4(), 'Projects', '/Projects', 0, 'application/folder', 'other', admin_user_id, true, '{"created_by": "system"}', 'System folder for project files', 'completed'),
        
        -- Test user folders
        (uuid_generate_v4(), 'My Documents', '/My Documents', 0, 'application/folder', 'other', test_user_id, true, '{"created_by": "user"}', 'Personal documents folder', 'completed'),
        (uuid_generate_v4(), 'Photos', '/Photos', 0, 'application/folder', 'other', test_user_id, true, '{"created_by": "user"}', 'Personal photos collection', 'completed'),
        
        -- Demo user folders
        (uuid_generate_v4(), 'Demo Files', '/Demo Files', 0, 'application/folder', 'other', demo_user_id, true, '{"created_by": "demo"}', 'Demo folder with sample content', 'completed');

    -- Create sample files for demo purposes
    INSERT INTO public.files (
        name, path, size_bytes, mime_type, category, user_id, 
        hash_md5, tags, ai_tags, ai_summary, analysis_status, metadata
    ) VALUES
        -- Admin user sample files
        ('System Configuration.pdf', '/Documents/System Configuration.pdf', 256000, 'application/pdf', 'document', admin_user_id,
         md5(random()::text), ARRAY['system', 'config', 'admin'], ARRAY['configuration', 'technical', 'system-admin'],
         'System configuration document containing setup instructions and administrative guidelines.', 'completed',
         '{"pages": 12, "author": "System Administrator", "creation_date": "2024-01-15"}'),
         
        ('User Analytics Report.xlsx', '/Documents/User Analytics Report.xlsx', 512000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'document', admin_user_id,
         md5(random()::text), ARRAY['analytics', 'report', 'users'], ARRAY['data-analysis', 'metrics', 'business-intelligence'],
         'Comprehensive user analytics report with engagement metrics and usage patterns.', 'completed',
         '{"sheets": 5, "rows": 1250, "charts": 8, "last_modified": "2024-08-29"}'),

        -- Test user sample files
        ('Meeting Notes.docx', '/My Documents/Meeting Notes.docx', 45000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'document', test_user_id,
         md5(random()::text), ARRAY['meeting', 'notes', 'work'], ARRAY['business', 'collaboration', 'project-planning'],
         'Meeting notes from project planning session discussing timeline and deliverables.', 'completed',
         '{"word_count": 750, "pages": 3, "created": "2024-08-28"}'),
         
        ('Vacation Photo.jpg', '/Photos/Vacation Photo.jpg', 2048000, 'image/jpeg', 'image', test_user_id,
         md5(random()::text), ARRAY['vacation', 'photo', 'personal'], ARRAY['landscape', 'travel', 'outdoor'],
         'Beautiful landscape photo taken during summer vacation showing mountains and lake.', 'completed',
         '{"width": 1920, "height": 1080, "camera": "iPhone 15", "location": "Lake Tahoe"}'),

        -- Demo user sample files  
        ('AI Analysis Demo.pdf', '/Demo Files/AI Analysis Demo.pdf', 128000, 'application/pdf', 'document', demo_user_id,
         md5(random()::text), ARRAY['demo', 'ai', 'analysis'], ARRAY['artificial-intelligence', 'machine-learning', 'tutorial'],
         'Demonstration document showcasing AI analysis capabilities including text extraction and content classification.', 'completed',
         '{"pages": 6, "language": "English", "demo_version": "1.0"}'),
         
        ('Sample Presentation.pptx', '/Demo Files/Sample Presentation.pptx', 1024000, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'document', demo_user_id,
         md5(random()::text), ARRAY['presentation', 'demo', 'sample'], ARRAY['business-presentation', 'slides', 'corporate'],
         'Sample business presentation demonstrating file analysis and smart organization features.', 'completed',
         '{"slides": 15, "theme": "Corporate", "animations": true}');

END $$;

-- Create sample AI analysis jobs
INSERT INTO public.ai_analysis_jobs (
    file_id, user_id, job_type, status, provider, model_used, 
    result, processing_time_ms
)
SELECT 
    f.id,
    f.user_id,
    'analyze_document',
    'completed',
    'openrouter',
    'mistral-7b-instruct',
    json_build_object(
        'document_type', f.category::text,
        'confidence', 0.95,
        'entities', json_build_array('FileInASnap', 'AI Analysis', 'Document Processing'),
        'summary', f.ai_summary,
        'key_topics', f.ai_tags
    ),
    floor(random() * 5000 + 1000)::INTEGER
FROM public.files f
WHERE f.is_folder = FALSE
LIMIT 5;

-- Create sample activity feed entries
INSERT INTO public.activity_feed (user_id, file_id, action, description, metadata)
SELECT 
    f.user_id,
    f.id,
    CASE 
        WHEN random() < 0.3 THEN 'file_uploaded'
        WHEN random() < 0.6 THEN 'ai_analysis_completed'
        ELSE 'file_viewed'
    END,
    CASE 
        WHEN random() < 0.3 THEN 'File uploaded successfully'
        WHEN random() < 0.6 THEN 'AI analysis completed with insights'
        ELSE 'File opened and viewed'
    END,
    json_build_object('source', 'demo_seed', 'automated', true)
FROM public.files f
WHERE f.is_folder = FALSE;

-- Update file version history
INSERT INTO public.file_versions (file_id, user_id, version_number, change_type, change_summary)
SELECT 
    f.id,
    f.user_id,
    1,
    'created',
    'Initial file upload'
FROM public.files f
WHERE f.is_folder = FALSE;

-- Create some sample shared links (inactive for security)
INSERT INTO public.shared_links (
    file_id, created_by, token, is_active, max_downloads
)
SELECT 
    f.id,
    f.user_id,
    encode(gen_random_bytes(32), 'hex'),
    false,  -- Keep inactive for security
    5
FROM public.files f
WHERE f.is_folder = FALSE 
  AND f.user_id = '33333333-3333-3333-3333-333333333333'  -- Demo user only
LIMIT 2;

-- Print summary of created data
DO $$
DECLARE
    profile_count INTEGER;
    file_count INTEGER;
    job_count INTEGER;
    activity_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO file_count FROM public.files;
    SELECT COUNT(*) INTO job_count FROM public.ai_analysis_jobs;
    SELECT COUNT(*) INTO activity_count FROM public.activity_feed;
    
    RAISE NOTICE '=== FileInASnap Database Seeded Successfully ===';
    RAISE NOTICE 'Profiles created: %', profile_count;
    RAISE NOTICE 'Files created: %', file_count;
    RAISE NOTICE 'AI jobs created: %', job_count;
    RAISE NOTICE 'Activity entries created: %', activity_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Test Users Created:';
    RAISE NOTICE '1. Admin: admin@fileinasnap.com (password: admin123!)';
    RAISE NOTICE '2. Test User: testuser@fileinasnap.com (password: test123!)';
    RAISE NOTICE '3. Demo User: demo@fileinasnap.com (password: demo123!)';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for testing! 🚀';
END $$;
