#!/bin/bash

# FileInASnap Database Deployment Script
# This script deploys the database schema and seed data to Neon via Netlify

set -e

echo "🚀 Starting FileInASnap Database Deployment..."
echo "================================================="

# Get database URL from Netlify environment
if [ -z "$NETLIFY_DATABASE_URL" ]; then
    echo "❌ Error: NETLIFY_DATABASE_URL not found"
    echo "Please make sure you're running this from a Netlify-linked project"
    exit 1
fi

echo "✅ Found Netlify Database URL"
echo "📍 Database: Neon PostgreSQL"

# Function to run SQL file
run_sql_file() {
    local file_path=$1
    local description=$2
    
    echo ""
    echo "📄 Running: $description"
    echo "   File: $file_path"
    
    if npx pgsh "$NETLIFY_DATABASE_URL" < "$file_path"; then
        echo "✅ Success: $description completed"
    else
        echo "❌ Error: Failed to run $description"
        exit 1
    fi
}

# Check if database is accessible
echo ""
echo "🔌 Testing database connection..."
if npx pgsh "$NETLIFY_DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Error: Cannot connect to database"
    echo "Please check your Netlify database configuration"
    exit 1
fi

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run schema deployment
run_sql_file "$SCRIPT_DIR/schema.sql" "Database Schema Setup"

# Run seed data deployment
run_sql_file "$SCRIPT_DIR/seed_data.sql" "Test Data and Users Setup"

# Verify deployment
echo ""
echo "🔍 Verifying deployment..."
echo "Running verification queries..."

# Check if tables exist
npx pgsh "$NETLIFY_DATABASE_URL" -c "
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
" | head -20

echo ""
echo "📊 Database Statistics:"

# Get counts
npx pgsh "$NETLIFY_DATABASE_URL" -c "
SELECT 
    'profiles' as table_name, 
    COUNT(*) as record_count 
FROM public.profiles
UNION ALL
SELECT 
    'files' as table_name, 
    COUNT(*) as record_count 
FROM public.files
UNION ALL
SELECT 
    'ai_analysis_jobs' as table_name, 
    COUNT(*) as record_count 
FROM public.ai_analysis_jobs
UNION ALL
SELECT 
    'activity_feed' as table_name, 
    COUNT(*) as record_count 
FROM public.activity_feed
ORDER BY table_name;
"

echo ""
echo "👥 Test Users Available:"
npx pgsh "$NETLIFY_DATABASE_URL" -c "
SELECT 
    email,
    full_name,
    role,
    created_at::date as created
FROM public.profiles 
ORDER BY role DESC, email;
"

echo ""
echo "================================================="
echo "🎉 Database Deployment Completed Successfully!"
echo ""
echo "📋 What's been set up:"
echo "   ✅ Complete database schema with all tables"
echo "   ✅ Indexes and triggers for performance"
echo "   ✅ Row Level Security (RLS) policies"
echo "   ✅ 3 test users with sample data"
echo "   ✅ AI analysis job examples"
echo "   ✅ Activity feed and file version history"
echo ""
echo "🔑 Test Login Credentials:"
echo "   👨‍💼 Admin: admin@fileinasnap.com / admin123!"
echo "   👤 Test User: testuser@fileinasnap.com / test123!"
echo "   🎯 Demo User: demo@fileinasnap.com / demo123!"
echo ""
echo "🌐 Your app is now ready for testing!"
echo "   Database URL: $(echo $NETLIFY_DATABASE_URL | sed 's/:[^@]*@/:***@/')"
echo ""
echo "🚀 Next Steps:"
echo "   1. Deploy your frontend to Netlify"
echo "   2. Set environment variables in Netlify dashboard"
echo "   3. Test user authentication and file operations"
echo ""
echo "================================================="
