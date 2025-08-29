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
        const { fileName, filePath, content, mimeType, metadata, summaryLength = 'medium' } = await req.json();
        
        if (!fileName) {
            throw new Error('File name is required');
        }

        // Get OpenRouter API key
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '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';
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Determine content for summarization
        let contentToSummarize = '';
        let contentType = 'unknown';

        if (content && content.trim()) {
            contentToSummarize = content;
            contentType = 'text';
        } else if (metadata && Object.keys(metadata).length > 0) {
            contentToSummarize = `File: ${fileName}\nType: ${mimeType || 'unknown'}\nMetadata: ${JSON.stringify(metadata, null, 2)}`;
            contentType = 'metadata';
        } else {
            contentToSummarize = `File: ${fileName}\nType: ${mimeType || 'unknown'}\nPath: ${filePath || 'Unknown location'}`;
            contentType = 'basic_info';
        }

        // Truncate content if too long
        if (contentToSummarize.length > 30000) {
            contentToSummarize = contentToSummarize.substring(0, 30000) + '... (truncated)';
        }

        // Determine summary parameters
        const lengthParams = {
            'short': { max_tokens: 500, description: '2-3 sentences' },
            'medium': { max_tokens: 1000, description: '1-2 paragraphs' },
            'long': { max_tokens: 2000, description: '2-3 paragraphs with details' }
        };
        
        const params = lengthParams[summaryLength] || lengthParams['medium'];

        // Create summarization prompt
        const summaryPrompt = `Create a ${summaryLength} summary of the following content in ${params.description}. Provide the summary in JSON format:

{
    "summary": "your concise summary here",
    "key_points": ["point1", "point2", "point3"],
    "content_type": "${contentType}",
    "main_topics": ["topic1", "topic2"],
    "key_entities": ["entity1", "entity2"],
    "sentiment": "positive/negative/neutral",
    "confidence": 0.95,
    "word_count": 150,
    "language": "detected language"
}

Content to summarize:
${contentToSummarize}`;

        let summaryResult = null;
        let provider = 'basic';
        let modelUsed = 'basic';

        if (openRouterKey && contentToSummarize.length > 50) {
            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openRouterKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://fileinasnap.io',
                        'X-Title': 'FileInASnap AI Summary Generation'
                    },
                    body: JSON.stringify({
                        model: 'mistralai/mistral-7b-instruct',
                        messages: [{ role: 'user', content: summaryPrompt }],
                        max_tokens: params.max_tokens,
                        temperature: 0.3
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const aiContent = data.choices?.[0]?.message?.content || '';
                    
                    try {
                        summaryResult = JSON.parse(aiContent);
                        provider = 'openrouter';
                        modelUsed = 'mistral-7b-instruct';
                    } catch {
                        // Fallback to text summary
                        summaryResult = {
                            summary: aiContent,
                            raw_response: aiContent,
                            confidence: 0.8,
                            content_type: contentType
                        };
                        provider = 'openrouter';
                        modelUsed = 'mistral-7b-instruct';
                    }
                } else {
                    throw new Error(`OpenRouter API error: ${response.status}`);
                }
            } catch (error) {
                console.warn('OpenRouter error for summary generation:', error);
                // Fallback to basic summary
                summaryResult = {
                    summary: contentToSummarize.length > 500 ? 
                            contentToSummarize.substring(0, 500) + '...' : 
                            contentToSummarize,
                    key_points: ['File analysis', 'Content preview'],
                    content_type: contentType,
                    confidence: 0.6,
                    note: 'Basic summary - AI generation unavailable'
                };
            }
        } else {
            // Basic summary generation
            let basicSummary = '';
            if (contentType === 'text' && content) {
                // Extract first few sentences for text content
                const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
                basicSummary = sentences.slice(0, 3).join('. ').trim();
                if (sentences.length > 3) basicSummary += '...';
            } else {
                basicSummary = `${fileName} is a ${mimeType || 'file'} located at ${filePath || 'unknown location'}.`;
            }

            summaryResult = {
                summary: basicSummary,
                key_points: [fileName.split('.').pop() || 'file', contentType],
                content_type: contentType,
                main_topics: [mimeType?.split('/')[0] || 'unknown'],
                confidence: 0.5,
                word_count: basicSummary.split(' ').length,
                note: openRouterKey ? 'Basic summary - content too short for AI' : 'Basic summary - OpenRouter API key not configured'
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

        // Store summary generation result
        if (userId && summaryResult) {
            try {
                const summaryData = {
                    user_id: userId,
                    analysis_type: 'content_summary',
                    provider: provider,
                    model_used: modelUsed,
                    content: {
                        fileName: fileName,
                        filePath: filePath,
                        summary: summaryResult,
                        summaryLength: summaryLength,
                        contentLength: contentToSummarize.length,
                        contentType: contentType
                    },
                    confidence_score: summaryResult.confidence || 0.5,
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
                    body: JSON.stringify(summaryData)
                });
            } catch (dbError) {
                console.warn('Failed to store summary generation result:', dbError);
            }
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                fileName: fileName,
                summaryLength: summaryLength,
                summary: summaryResult,
                provider: provider,
                modelUsed: modelUsed,
                timestamp: new Date().toISOString(),
                file_info: {
                    name: fileName,
                    path: filePath,
                    mime_type: mimeType,
                    content_length: contentToSummarize.length,
                    content_type: contentType
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Summary generation error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'SUMMARY_GENERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});