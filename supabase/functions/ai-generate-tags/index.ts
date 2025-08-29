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
        const { fileName, filePath, mimeType, content, metadata, maxTags = 10, tagCategories } = await req.json();
        
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

        // Prepare content for tag generation
        const contentForTagging = `File: ${fileName}
Type: ${mimeType || 'unknown'}
Path: ${filePath || 'Not specified'}
${metadata ? `Metadata: ${JSON.stringify(metadata, null, 2)}` : ''}
${content ? `\n\nContent:\n${content.substring(0, 10000)}` : ''}`;

        // Create comprehensive tagging prompt
        const tagPrompt = `Generate intelligent, relevant tags for this file. Consider:
1. Content topics and themes
2. File type and format
3. Technical attributes
4. Potential use cases
5. Organizational categories
6. Contextual information

${contentForTagging}

Generate up to ${maxTags} relevant tags. Format as JSON:
{
    "tags": ["tag1", "tag2", "tag3"],
    "tag_categories": {
        "content": ["content-related tags"],
        "technical": ["technical tags"],
        "organizational": ["organizational tags"],
        "contextual": ["contextual tags"]
    },
    "primary_tags": ["most important tags"],
    "secondary_tags": ["supporting tags"],
    "confidence": 0.95,
    "tag_rationale": {
        "tag1": "reason for this tag",
        "tag2": "reason for this tag"
    }
}${tagCategories ? `\n\nFocus on these tag categories: ${tagCategories.join(', ')}` : ''}`;

        let tagResult = null;
        let provider = 'basic';
        let modelUsed = 'basic';

        if (openRouterKey) {
            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openRouterKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://fileinasnap.io',
                        'X-Title': 'FileInASnap AI Tag Generation'
                    },
                    body: JSON.stringify({
                        model: 'mistralai/mistral-7b-instruct',
                        messages: [{ role: 'user', content: tagPrompt }],
                        max_tokens: 1500,
                        temperature: 0.3
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const aiContent = data.choices?.[0]?.message?.content || '';
                    
                    try {
                        tagResult = JSON.parse(aiContent);
                        provider = 'openrouter';
                        modelUsed = 'mistral-7b-instruct';
                    } catch {
                        // Fallback: extract tags from text response
                        const tags = [];
                        const lines = aiContent.split('\n');
                        for (const line of lines) {
                            if (line.includes('tag') || line.includes('#')) {
                                const matches = line.match(/["']([^"']+)["']/g);
                                if (matches) {
                                    tags.push(...matches.map(m => m.slice(1, -1)));
                                }
                            }
                        }
                        
                        tagResult = {
                            tags: tags.slice(0, maxTags),
                            raw_response: aiContent,
                            confidence: 0.7
                        };
                        provider = 'openrouter';
                        modelUsed = 'mistral-7b-instruct';
                    }
                } else {
                    throw new Error(`OpenRouter API error: ${response.status}`);
                }
            } catch (error) {
                console.warn('OpenRouter error for tag generation:', error);
                // Fallback to basic tag generation
                tagResult = {
                    tags: [
                        fileName.split('.').pop() || 'file',
                        mimeType?.split('/')[0] || 'unknown',
                        mimeType?.split('/')[1] || 'type',
                        'document',
                        'uploaded'
                    ].filter(Boolean).slice(0, maxTags),
                    tag_categories: {
                        technical: [mimeType?.split('/')[0] || 'unknown', fileName.split('.').pop() || 'file'],
                        organizational: ['document', 'uploaded']
                    },
                    confidence: 0.6,
                    note: 'Basic tags - AI generation unavailable'
                };
            }
        } else {
            // Basic tag generation without API
            const extension = fileName.split('.').pop() || 'file';
            const mimeCategory = mimeType?.split('/')[0] || 'unknown';
            const mimeSubtype = mimeType?.split('/')[1] || 'type';
            
            tagResult = {
                tags: [extension, mimeCategory, mimeSubtype, 'document', 'uploaded']
                    .filter(Boolean).slice(0, maxTags),
                tag_categories: {
                    technical: [mimeCategory, extension],
                    organizational: ['document', 'uploaded'],
                    content: content ? ['text-content'] : []
                },
                primary_tags: [extension, mimeCategory],
                confidence: 0.5,
                note: 'Basic tags - OpenRouter API key not configured'
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

        // Store tag generation result
        if (userId && tagResult) {
            try {
                const tagData = {
                    user_id: userId,
                    analysis_type: 'tag_generation',
                    provider: provider,
                    model_used: modelUsed,
                    content: {
                        fileName: fileName,
                        filePath: filePath,
                        tags: tagResult,
                        maxTags: maxTags,
                        tagCategories: tagCategories
                    },
                    confidence_score: tagResult.confidence || 0.5,
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
                    body: JSON.stringify(tagData)
                });
            } catch (dbError) {
                console.warn('Failed to store tag generation result:', dbError);
            }
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                fileName: fileName,
                tags: tagResult,
                provider: provider,
                modelUsed: modelUsed,
                timestamp: new Date().toISOString(),
                file_info: {
                    name: fileName,
                    path: filePath,
                    mime_type: mimeType,
                    content_length: content?.length || 0
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Tag generation error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'TAG_GENERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});