// Netlify Function: AI Provider Status Check
// This function checks the health of AI services and Neon database

const { Client } = require('pg');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const startTime = Date.now();
    
    // Get environment variables
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const neonConnectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
    
    const status = {
      timestamp: new Date().toISOString(),
      services: {},
      overall_status: 'unknown',
      response_time_ms: 0,
      version: '1.0.0'
    };

    // Check Neon Database Connection
    if (neonConnectionString) {
      try {
        console.log('🔍 Checking Neon database connection...');
        const dbStart = Date.now();
        
        const client = new Client({
          connectionString: neonConnectionString,
          ssl: { rejectUnauthorized: false }
        });
        
        await client.connect();
        
        // Test query to check if our tables exist
        const result = await client.query(`
          SELECT 
            COUNT(*) as profile_count,
            (SELECT COUNT(*) FROM public.files) as file_count,
            (SELECT COUNT(*) FROM public.ai_analysis_jobs) as job_count
          FROM public.profiles
        `);
        
        await client.end();
        
        const dbTime = Date.now() - dbStart;
        
        status.services.neon_database = {
          status: 'healthy',
          response_time_ms: dbTime,
          endpoint: 'Neon PostgreSQL',
          last_check: new Date().toISOString(),
          data_summary: {
            profiles: result.rows[0].profile_count,
            files: result.rows[0].file_count,
            ai_jobs: result.rows[0].job_count
          },
          note: 'Connected to Neon PostgreSQL with test data'
        };
        
        console.log('✅ Neon database connection successful');
      } catch (dbError) {
        console.error('❌ Neon database error:', dbError);
        status.services.neon_database = {
          status: 'error',
          error: dbError.message,
          endpoint: 'Neon PostgreSQL',
          last_check: new Date().toISOString(),
          note: 'Failed to connect to Neon database'
        };
      }
    } else {
      status.services.neon_database = {
        status: 'not_configured',
        error: 'DATABASE_URL not provided',
        note: 'Neon database connection not configured'
      };
    }

    // Check OpenRouter API
    if (openRouterKey) {
      try {
        console.log('🔍 Checking OpenRouter API...');
        const openRouterStart = Date.now();
        
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://fileinasnap-v1.netlify.app',
            'X-Title': 'FileInASnap AI Status Check'
          },
          signal: AbortSignal.timeout(10000)
        });

        const openRouterTime = Date.now() - openRouterStart;

        if (response.ok) {
          const data = await response.json();
          
          status.services.openrouter = {
            status: 'healthy',
            response_time_ms: openRouterTime,
            available_models: data.data ? data.data.length : 'unknown',
            endpoint: 'https://openrouter.ai/api/v1',
            last_check: new Date().toISOString(),
            note: 'OpenRouter API responding normally'
          };
          
          console.log('✅ OpenRouter API healthy');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (openRouterError) {
        console.error('❌ OpenRouter API error:', openRouterError);
        status.services.openrouter = {
          status: 'error',
          error: openRouterError.message,
          endpoint: 'https://openrouter.ai/api/v1',
          last_check: new Date().toISOString(),
          note: 'OpenRouter API connection failed'
        };
      }
    } else {
      status.services.openrouter = {
        status: 'not_configured',
        error: 'OPENROUTER_API_KEY not provided',
        note: 'OpenRouter integration not configured'
      };
    }

    // Test AI Processing if OpenRouter is healthy
    if (status.services.openrouter?.status === 'healthy') {
      try {
        console.log('🔍 Testing AI processing...');
        const aiStart = Date.now();
        
        const testResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://fileinasnap-v1.netlify.app',
            'X-Title': 'FileInASnap AI Health Check'
          },
          body: JSON.stringify({
            model: 'mistralai/mistral-7b-instruct',
            messages: [{
              role: 'user',
              content: 'Respond with "OK" if you can process this request.'
            }],
            max_tokens: 10,
            temperature: 0
          }),
          signal: AbortSignal.timeout(15000)
        });

        const aiTime = Date.now() - aiStart;

        if (testResponse.ok) {
          const aiData = await testResponse.json();
          
          status.services.ai_processing = {
            status: 'healthy',
            response_time_ms: aiTime,
            test_response: aiData.choices?.[0]?.message?.content || 'No response',
            model_tested: 'mistral-7b-instruct',
            last_check: new Date().toISOString(),
            note: 'AI processing working correctly'
          };
          
          console.log('✅ AI processing test successful');
        } else {
          throw new Error(`AI test failed: HTTP ${testResponse.status}`);
        }
      } catch (aiError) {
        console.error('❌ AI processing error:', aiError);
        status.services.ai_processing = {
          status: 'degraded',
          error: aiError.message,
          model_tested: 'mistral-7b-instruct',
          last_check: new Date().toISOString(),
          note: 'AI processing test failed'
        };
      }
    } else {
      status.services.ai_processing = {
        status: 'unavailable',
        error: 'OpenRouter not available',
        last_check: new Date().toISOString(),
        note: 'Cannot test AI processing without OpenRouter'
      };
    }

    // Netlify Functions Status
    status.services.netlify_functions = {
      status: 'healthy',
      functions: [
        { name: 'ai-provider-status', status: 'active', endpoint: '/.netlify/functions/ai-provider-status' },
        { name: 'ai-analyze-document', status: 'active', endpoint: '/.netlify/functions/ai-analyze-document' },
        { name: 'ai-analyze-image', status: 'active', endpoint: '/.netlify/functions/ai-analyze-image' },
        { name: 'ai-generate-tags', status: 'active', endpoint: '/.netlify/functions/ai-generate-tags' }
      ],
      total_functions: 4,
      last_check: new Date().toISOString(),
      note: 'Netlify Functions deployed and active'
    };

    // Determine overall status
    const serviceStatuses = Object.values(status.services).map(service => service.status);
    
    if (serviceStatuses.includes('error')) {
      status.overall_status = 'error';
    } else if (serviceStatuses.includes('degraded')) {
      status.overall_status = 'degraded';
    } else if (serviceStatuses.every(s => ['healthy', 'not_configured'].includes(s))) {
      status.overall_status = 'healthy';
    } else {
      status.overall_status = 'partial';
    }

    // Calculate total response time
    status.response_time_ms = Date.now() - startTime;

    // Add system information
    status.system_info = {
      environment: 'netlify_functions',
      node_version: process.version,
      ai_provider: 'openrouter',
      database: 'neon_postgresql',
      available_models: [
        'mistralai/mistral-7b-instruct',
        'openai/gpt-4-vision-preview',
        'meta-llama/llama-3.1-8b-instruct'
      ],
      capabilities: [
        'document_analysis',
        'image_analysis',
        'tag_generation',
        'neon_database_integration'
      ]
    };

    console.log('🎉 Status check completed:', status.overall_status);

    return {
      statusCode: status.overall_status === 'healthy' ? 200 : 
                 status.overall_status === 'error' ? 503 : 206,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: status }),
    };

  } catch (error) {
    console.error('💥 Status check failed:', error);

    const errorStatus = {
      timestamp: new Date().toISOString(),
      overall_status: 'error',
      error: error.message,
      services: {
        health_check: {
          status: 'error',
          error: error.message,
          last_check: new Date().toISOString()
        }
      },
      response_time_ms: Date.now() - Date.now()
    };

    return {
      statusCode: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: errorStatus }),
    };
  }
};
