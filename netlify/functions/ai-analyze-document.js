// Netlify Function: AI Document Analysis
// This function analyzes documents using OpenRouter and stores results in Neon

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { fileContent, fileName, filePath, analysisType = 'comprehensive', maxContentLength = 50000 } = JSON.parse(event.body);
    
    if (!fileContent || !fileName) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'File content and filename are required' }),
      };
    }

    // Get environment variables
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const neonConnectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
    
    if (!openRouterKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'OpenRouter API key not configured' }),
      };
    }

    // Truncate content if needed
    const truncatedContent = fileContent.length > maxContentLength 
      ? fileContent.substring(0, maxContentLength) + '...'
      : fileContent;

    // Create comprehensive analysis prompt
    const analysisPrompt = `Analyze this document comprehensively and provide structured insights.

Document: ${fileName}
Content:
${truncatedContent}

Provide analysis in JSON format with:
{
    "document_type": "type and format",
    "main_topics": ["topic1", "topic2", "topic3"],
    "key_entities": {
        "people": ["person1", "person2"],
        "places": ["location1", "location2"],
        "dates": ["date1", "date2"],
        "organizations": ["org1", "org2"]
    },
    "summary": "2-3 sentence summary",
    "suggested_tags": ["tag1", "tag2", "tag3"],
    "content_category": "primary category",
    "sentiment": "positive/negative/neutral",
    "confidence_score": 0.95,
    "key_insights": ["insight1", "insight2"],
    "language": "detected language"
}`;

    let analysisResult = null;
    let provider = 'basic';
    let modelUsed = 'basic';

    console.log('🔍 Analyzing document:', fileName);

    try {
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://fileinasnap-v1.netlify.app',
          'X-Title': 'FileInASnap AI Document Analysis'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct',
          messages: [{ role: 'user', content: analysisPrompt }],
          max_tokens: 2000,
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (openRouterResponse.ok) {
        const data = await openRouterResponse.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        try {
          // Try to parse as JSON
          analysisResult = JSON.parse(content);
          provider = 'openrouter';
          modelUsed = 'mistral-7b-instruct';
          console.log('✅ OpenRouter analysis successful');
        } catch {
          // Fallback to text response
          analysisResult = { 
            raw_analysis: content,
            document_type: fileName.split('.').pop()?.toUpperCase() || 'Unknown',
            summary: content.substring(0, 200) + '...',
            confidence_score: 0.7
          };
          provider = 'openrouter';
          modelUsed = 'mistral-7b-instruct';
        }
      } else {
        throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
      }
    } catch (error) {
      console.warn('OpenRouter API error, using fallback:', error);
      // Fallback to basic analysis
      analysisResult = {
        document_type: fileName.split('.').pop()?.toUpperCase() || 'Unknown',
        summary: `Document analysis for ${fileName}. Content length: ${fileContent.length} characters.`,
        suggested_tags: ['document', fileName.split('.').pop() || 'file'],
        confidence_score: 0.5,
        main_topics: ['document', 'analysis'],
        content_category: 'document',
        sentiment: 'neutral',
        language: 'unknown',
        key_insights: ['Document processed', 'Basic analysis completed'],
        note: 'Fallback analysis - OpenRouter temporarily unavailable'
      };
      provider = 'fallback';
      modelUsed = 'basic';
    }

    // Store analysis result in Neon database if configured
    if (neonConnectionString && analysisResult) {
      try {
        console.log('💾 Storing analysis result in Neon database...');
        
        const client = new Client({
          connectionString: neonConnectionString,
          ssl: { rejectUnauthorized: false }
        });
        
        await client.connect();
        
        // Get a demo user ID for now (in production, this would come from auth)
        const userResult = await client.query('SELECT id FROM public.profiles LIMIT 1');
        const userId = userResult.rows[0]?.id;
        
        if (userId) {
          const analysisData = {
            user_id: userId,
            job_type: 'analyze_document',
            status: 'completed',
            provider: provider,
            model_used: modelUsed,
            input_data: {
              fileName: fileName,
              filePath: filePath,
              contentLength: fileContent.length,
              analysisType: analysisType
            },
            result: analysisResult,
            processing_time_ms: 0, // We'll calculate this
            created_at: new Date().toISOString()
          };

          await client.query(`
            INSERT INTO public.ai_analysis_jobs 
            (user_id, job_type, status, provider, model_used, input_data, result, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            analysisData.user_id,
            analysisData.job_type,
            analysisData.status,
            analysisData.provider,
            analysisData.model_used,
            JSON.stringify(analysisData.input_data),
            JSON.stringify(analysisData.result),
            analysisData.created_at
          ]);
          
          console.log('✅ Analysis result stored in database');
        }
        
        await client.end();
      } catch (dbError) {
        console.warn('Failed to store analysis result in database:', dbError);
        // Don't fail the whole request if database storage fails
      }
    }

    const response = {
      data: {
        success: true,
        fileName: fileName,
        analysisType: analysisType,
        analysis: analysisResult,
        provider: provider,
        modelUsed: modelUsed,
        timestamp: new Date().toISOString(),
        contentPreview: truncatedContent.substring(0, 500) + (truncatedContent.length > 500 ? '...' : '')
      }
    };

    console.log('🎉 Document analysis completed successfully');

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('💥 Document analysis error:', error);

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: {
          code: 'DOCUMENT_ANALYSIS_FAILED',
          message: error.message
        }
      }),
    };
  }
};
