Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { fileContent, fileName, filePath, analysisType = 'comprehensive', maxContentLength = 50000 } = await req.json();
        
        if (!fileContent || !fileName) {
            throw new Error('File content and filename are required');
        }

        // Get OpenRouter API key
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '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';
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
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

        if (openRouterKey) {
            try {
                const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openRouterKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://fileinasnap.io',
                        'X-Title': 'FileInASnap AI Document Analysis'
                    },
                    body: JSON.stringify({
                        model: 'mistralai/mistral-7b-instruct',
                        messages: [{ role: 'user', content: analysisPrompt }],
                        max_tokens: 2000,
                        temperature: 0.1
                    })
                });

                if (openRouterResponse.ok) {
                    const data = await openRouterResponse.json();
                    const content = data.choices?.[0]?.message?.content || '';
                    
                    try {
                        // Try to parse as JSON
                        analysisResult = JSON.parse(content);
                        provider = 'openrouter';
                        modelUsed = 'mistral-7b-instruct';
                    } catch {
                        // Fallback to text response
                        analysisResult = { raw_analysis: content };
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
                    note: 'Basic analysis - AI analysis temporarily unavailable'
                };
            }
        } else {
            // Basic fallback analysis
            analysisResult = {
                document_type: fileName.split('.').pop()?.toUpperCase() || 'Unknown',
                summary: `Document analysis for ${fileName}. Content length: ${fileContent.length} characters.`,
                suggested_tags: ['document', fileName.split('.').pop() || 'file'],
                confidence_score: 0.5,
                note: 'Basic analysis - OpenRouter API key not configured'
            };
        }

        // Get user from auth header
        let userId = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': serviceRoleKey
                    }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    userId = userData.id;
                }
            } catch (error) {
                console.log('Could not get user from token:', error.message);
            }
        }

        // Store analysis result in database
        if (userId && analysisResult) {
            try {
                const analysisData = {
                    user_id: userId,
                    analysis_type: 'document_analysis',
                    provider: provider,
                    model_used: modelUsed,
                    content: {
                        fileName: fileName,
                        filePath: filePath,
                        analysis: analysisResult,
                        contentLength: fileContent.length,
                        analysisType: analysisType
                    },
                    confidence_score: analysisResult.confidence_score || 0.5,
                    status: 'completed',
                    created_at: new Date().toISOString()
                };

                await fetch(`${supabaseUrl}/rest/v1/ai_analysis_results`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(analysisData)
                });
            } catch (dbError) {
                console.warn('Failed to store analysis result:', dbError);
            }
        }

        return new Response(JSON.stringify({
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
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Document analysis error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'DOCUMENT_ANALYSIS_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});