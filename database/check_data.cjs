#!/usr/bin/env node

const { Client } = require('pg');

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || 
  'postgresql://neondb_owner:npg_3XzoWY0khMAD@ep-cool-salad-aejesikb-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function checkDatabase() {
  console.log('🔍 Checking FileInASnap Database Contents...');
  console.log('=================================================');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Database connection successful');

    // Check auth.users table
    console.log('\n👥 Checking auth.users table:');
    try {
      const authUsers = await client.query('SELECT id, email, created_at FROM auth.users ORDER BY created_at');
      if (authUsers.rows.length > 0) {
        console.log(`Found ${authUsers.rows.length} users in auth.users:`);
        authUsers.rows.forEach(user => {
          console.log(`   📧 ${user.email} (${user.id.substring(0, 8)}...)`);
        });
      } else {
        console.log('   ❌ No users found in auth.users table');
      }
    } catch (error) {
      console.log(`   ❌ Error querying auth.users: ${error.message}`);
    }

    // Check public.profiles table
    console.log('\n👤 Checking public.profiles table:');
    try {
      const profiles = await client.query('SELECT id, email, full_name, role, created_at FROM public.profiles ORDER BY created_at');
      if (profiles.rows.length > 0) {
        console.log(`Found ${profiles.rows.length} profiles:`);
        profiles.rows.forEach(profile => {
          console.log(`   👤 ${profile.full_name || 'No name'} (${profile.email}) - Role: ${profile.role}`);
        });
      } else {
        console.log('   ❌ No profiles found in public.profiles table');
      }
    } catch (error) {
      console.log(`   ❌ Error querying public.profiles: ${error.message}`);
    }

    // Check public.files table
    console.log('\n📁 Checking public.files table:');
    try {
      const files = await client.query('SELECT COUNT(*) as count FROM public.files');
      console.log(`   📊 Total files: ${files.rows[0].count}`);
      
      if (parseInt(files.rows[0].count) > 0) {
        const sampleFiles = await client.query('SELECT name, user_id, created_at FROM public.files LIMIT 5');
        console.log('   Sample files:');
        sampleFiles.rows.forEach(file => {
          console.log(`     📄 ${file.name} (User: ${file.user_id.substring(0, 8)}...)`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error querying public.files: ${error.message}`);
    }

    // Check all tables
    console.log('\n📋 All tables in database:');
    const tables = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname IN ('public', 'auth') 
      ORDER BY schemaname, tablename
    `);
    
    tables.rows.forEach(table => {
      console.log(`   🗃️  ${table.schemaname}.${table.tablename}`);
    });

  } catch (error) {
    console.error('❌ Error during database check:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run check
if (require.main === module) {
  checkDatabase().catch(console.error);
}

module.exports = checkDatabase;
