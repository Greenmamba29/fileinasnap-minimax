#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || 
  'postgresql://neondb_owner:npg_3XzoWY0khMAD@ep-cool-salad-aejesikb-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function deployDatabase() {
  console.log('🚀 Starting FileInASnap Database Deployment...');
  console.log('=================================================');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Database connection successful');

    // Test query
    const versionResult = await client.query('SELECT version()');
    console.log(`📍 Database: ${versionResult.rows[0].version.split(' ')[0]} ${versionResult.rows[0].version.split(' ')[1]}`);

    // Read and execute schema
    console.log('');
    console.log('📄 Running: Database Schema Setup');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('   File: schema.sql');
    
    await client.query(schemaSQL);
    console.log('✅ Success: Database Schema Setup completed');

    // Read and execute seed data
    console.log('');
    console.log('📄 Running: Test Data and Users Setup');
    const seedSQL = fs.readFileSync(path.join(__dirname, 'seed_data.sql'), 'utf8');
    console.log('   File: seed_data.sql');
    
    await client.query(seedSQL);
    console.log('✅ Success: Test Data and Users Setup completed');

    // Verification queries
    console.log('');
    console.log('🔍 Verifying deployment...');
    console.log('Running verification queries...');

    // Check tables
    const tablesResult = await client.query(`
      SELECT 
          schemaname,
          tablename,
          tableowner
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);

    console.log('');
    console.log('📊 Database Statistics:');

    // Get counts
    const statsResult = await client.query(`
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
    `);

    statsResult.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.record_count} records`);
    });

    console.log('');
    console.log('👥 Test Users Available:');
    const usersResult = await client.query(`
      SELECT 
          email,
          full_name,
          role,
          created_at::date as created
      FROM public.profiles 
      ORDER BY role DESC, email;
    `);

    usersResult.rows.forEach(user => {
      console.log(`   ${user.role === 'admin' ? '👨‍💼' : '👤'} ${user.full_name} (${user.email}) - ${user.role}`);
    });

    console.log('');
    console.log('=================================================');
    console.log('🎉 Database Deployment Completed Successfully!');
    console.log('');
    console.log('📋 What\'s been set up:');
    console.log('   ✅ Complete database schema with all tables');
    console.log('   ✅ Indexes and triggers for performance');
    console.log('   ✅ Row Level Security (RLS) policies');
    console.log('   ✅ 3 test users with sample data');
    console.log('   ✅ AI analysis job examples');
    console.log('   ✅ Activity feed and file version history');
    console.log('');
    console.log('🔑 Test Login Credentials:');
    console.log('   👨‍💼 Admin: admin@fileinasnap.com / admin123!');
    console.log('   👤 Test User: testuser@fileinasnap.com / test123!');
    console.log('   🎯 Demo User: demo@fileinasnap.com / demo123!');
    console.log('');
    console.log('🌐 Your app is now ready for testing!');
    console.log('   Database URL: ' + DATABASE_URL.replace(/:([^@]+)@/, ':***@'));
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Deploy your frontend to Netlify');
    console.log('   2. Set environment variables in Netlify dashboard');
    console.log('   3. Test user authentication and file operations');
    console.log('');
    console.log('=================================================');

  } catch (error) {
    console.error('❌ Error during database deployment:', error.message);
    console.error('');
    console.error('📋 Troubleshooting:');
    console.error('   • Check your database connection string');
    console.error('   • Verify Neon database is running');
    console.error('   • Ensure proper SSL configuration');
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run deployment
if (require.main === module) {
  deployDatabase().catch(console.error);
}

module.exports = deployDatabase;
