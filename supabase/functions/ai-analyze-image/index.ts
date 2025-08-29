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
        const { imageBase64, fileName, filePath, analysisType = 'comprehensive' } = await req.json();
        
        if (!imageBase64 || !fileName) {
            throw new Error('Image data and filename are required');
        }

        // Get OpenRouter API key
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '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';
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Create comprehensive image analysis prompt
        let analysisPrompt = '';
        if (analysisType === 'comprehensive') {
            analysisPrompt = `Please analyze this image comprehensively and provide structured information in JSON format:

{
    "description": "detailed description of the image",
    "objects_detected": ["object1", "object2", "object3"],
    "text_content": "any text visible in the image (OCR)",
    "colors": {
        "dominant": ["color1", "color2"],
        "palette": ["#hex1", "#hex2", "#hex3"]
    },
    "composition": {
        "orientation": "landscape/portrait/square",
        "style": "photography/illustration/diagram/screenshot",
        "quality": "high/medium/low"
    },
    "content_categories": ["category1", "category2"],
    "suggested_tags": ["tag1", "tag2", "tag3"],
    "technical_details": {
        "estimated_dimensions": "width x height",
        "image_type": "photo/graphic/document/screenshot"
    },
    "context_clues": ["clue1", "clue2"],
    "confidence": 0.95,
    "potential_uses": ["use1", "use2"]
}`;
        } else if (analysisType === 'objects') {
            analysisPrompt = 'Identify and list all objects, people, and items visible in this image. Provide as JSON with objects array.';
        } else if (analysisType === 'text') {
            analysisPrompt = 'Extract and transcribe any text visible in this image (OCR). Provide as JSON with extracted_text field.';
        } else if (analysisType === 'description') {
            analysisPrompt = 'Provide a detailed description of this image. What do you see? Provide as JSON with description field.';
        }

        // Ensure the image data is properly formatted
        let imageUrl = imageBase64;
        if (!imageBase64.startsWith('data:image/')) {
            imageUrl = `data:image/jpeg;base64,${imageBase64}`;
        }

        let analysisResult = null;
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
                        'X-Title': 'FileInASnap AI Image Analysis'
                    },
                    body: JSON.stringify({
                        model: 'openai/gpt-4-vision-preview',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: analysisPrompt
                                    },
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: imageUrl
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: 2000,
                        temperature: 0.1
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content || '';
                    
                    try {
                        analysisResult = JSON.parse(content);
                        provider = 'openrouter';
                        modelUsed = 'gpt-4-vision-preview';
                    } catch {
                        // Fallback to structured text response
                        analysisResult = {
                            description: content,
                            raw_response: content,
                            confidence: 0.8
                        };
                        provider = 'openrouter';
                        modelUsed = 'gpt-4-vision-preview';
                    }
                } else {
                    throw new Error(`OpenRouter API error: ${response.status}`);
                }
            } catch (error) {
                console.warn('OpenRouter vision API error, using fallback:', error);
                // Try with a text model as backup
                try {
                    const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${openRouterKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://fileinasnap.io',
                            'X-Title': 'FileInASnap AI Image Analysis'
                        },
                        body: JSON.stringify({
                            model: 'mistralai/mistral-7b-instruct',
                            messages: [{
                                role: 'user',
                                content: `Analyze this image file: ${fileName}. Based on the filename and context, provide basic image analysis in JSON format with description, suggested_tags, and confidence fields.`
                            }],
                            max_tokens: 1000,
                            temperature: 0.3
                        })
                    });

                    if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        const fallbackContent = fallbackData.choices?.[0]?.message?.content || '';
                        
                        try {
                            analysisResult = JSON.parse(fallbackContent);
                        } catch {
                            analysisResult = { description: fallbackContent, confidence: 0.6 };
                        }
                        provider = 'openrouter';
                        modelUsed = 'mistral-7b-instruct (fallback)';
                    } else {
                        throw new Error('Fallback analysis also failed');
                    }
                } catch (fallbackError) {
                    console.warn('Fallback analysis failed:', fallbackError);
                    // Basic analysis
                    analysisResult = {
                        description: `Image file: ${fileName}`,
                        image_type: fileName.split('.').pop()?.toLowerCase() || 'unknown',
                        suggested_tags: ['image', fileName.split('.').pop() || 'file'],
                        confidence: 0.5,
                        note: 'Basic analysis - AI vision analysis unavailable'
                    };
                }
            }
        } else {
            // Basic analysis without API
            const extension = fileName.split('.').pop()?.toLowerCase() || 'unknown';
            analysisResult = {
                description: `Image file: ${fileName}`,
                image_type: extension,
                technical_details: {
                    file_extension: extension,
                    estimated_type: 'image'
                },
                suggested_tags: ['image', extension],
                confidence: 0.5,
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

        // Store image analysis result
        if (userId && analysisResult) {
            try {
                const analysisData = {
                    user_id: userId,
                    analysis_type: 'image_analysis',
                    provider: provider,
                    model_used: modelUsed,
                    content: {
                        fileName: fileName,
                        filePath: filePath,
                        analysis: analysisResult,
                        analysisType: analysisType
                    },
                    confidence_score: analysisResult.confidence || 0.5,
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
                console.warn('Failed to store image analysis result:', dbError);
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
                file_info: {
                    name: fileName,
                    path: filePath,
                    type: 'image'
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Image analysis error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'IMAGE_ANALYSIS_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});