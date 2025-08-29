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
        const { files, customCategories } = await req.json();
        
        if (!files || !Array.isArray(files)) {
            throw new Error('Files array is required');
        }

        // Get OpenRouter API key
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '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';
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Default categories
        const defaultCategories = [
            'Documents', 'Images', 'Videos', 'Audio', 'Archives',
            'Code', 'Presentations', 'Spreadsheets', 'PDFs', 'Text Files',
            'Projects', 'Personal', 'Work', 'Reference', 'Temporary'
        ];
        
        const categories = customCategories || defaultCategories;
        const results = {
            categorizations: {},
            summary: {},
            errors: {},
            success: true
        };

        // Process each file
        for (const file of files) {
            const { fileName, filePath, mimeType, size, content } = file;
            
            try {
                // Prepare content for classification
                const fileInfo = `
File: ${fileName}
Type: ${mimeType}
Size: ${size} bytes
Path: ${filePath || 'Not specified'}
Content Preview: ${content ? content.substring(0, 1000) : 'No content available'}...`;

                const classificationPrompt = `Classify this file into appropriate categories from the available list.

${fileInfo}

Available Categories: ${categories.join(', ')}

Provide classification in JSON format:
{
    "primary_category": "main category",
    "secondary_categories": ["cat1", "cat2"],
    "content_type": "document/image/video/audio/archive/code",
    "language": "detected language",
    "sentiment": "positive/negative/neutral",
    "confidence": 0.95,
    "suggested_folder": "folder name",
    "organization_tags": ["tag1", "tag2", "tag3"],
    "priority_level": "high/medium/low",
    "description": "Brief description of content"
}`;

                let classification = null;
                let provider = 'basic';

                if (openRouterKey) {
                    try {
                        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${openRouterKey}`,
                                'Content-Type': 'application/json',
                                'HTTP-Referer': 'https://fileinasnap.io',
                                'X-Title': 'FileInASnap AI File Categorization'
                            },
                            body: JSON.stringify({
                                model: 'mistralai/mistral-7b-instruct',
                                messages: [{ role: 'user', content: classificationPrompt }],
                                max_tokens: 1000,
                                temperature: 0.1
                            })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            const content = data.choices?.[0]?.message?.content || '';
                            
                            try {
                                classification = JSON.parse(content);
                                provider = 'openrouter';
                            } catch {
                                classification = { raw_response: content };
                                provider = 'openrouter';
                            }
                        } else {
                            throw new Error(`OpenRouter API error: ${response.status}`);
                        }
                    } catch (error) {
                        console.warn(`OpenRouter error for ${fileName}:`, error);
                        // Fallback to basic classification
                        classification = {
                            primary_category: mimeType?.startsWith('image') ? 'Images' : 
                                            mimeType?.startsWith('video') ? 'Videos' :
                                            mimeType?.startsWith('audio') ? 'Audio' :
                                            mimeType?.includes('pdf') ? 'PDFs' : 'Documents',
                            content_type: mimeType?.split('/')[0] || 'unknown',
                            confidence: 0.6,
                            organization_tags: [fileName.split('.').pop() || 'file'],
                            note: 'Basic classification - AI analysis unavailable'
                        };
                    }
                } else {
                    // Basic classification without API
                    classification = {
                        primary_category: mimeType?.startsWith('image') ? 'Images' : 
                                        mimeType?.startsWith('video') ? 'Videos' :
                                        mimeType?.startsWith('audio') ? 'Audio' :
                                        mimeType?.includes('pdf') ? 'PDFs' : 'Documents',
                        content_type: mimeType?.split('/')[0] || 'unknown',
                        confidence: 0.5,
                        organization_tags: [fileName.split('.').pop() || 'file'],
                        note: 'Basic classification - OpenRouter API key not configured'
                    };
                }

                results.categorizations[fileName] = {
                    file_info: {
                        name: fileName,
                        path: filePath,
                        mime_type: mimeType,
                        size: size
                    },
                    classification: classification,
                    provider: provider,
                    timestamp: new Date().toISOString()
                };
                
            } catch (error) {
                console.error(`Failed to categorize ${fileName}:`, error);
                results.errors[fileName] = error.message;
            }
        }

        // Generate summary
        const totalFiles = files.length;
        const successful = Object.keys(results.categorizations).length;
        const failed = Object.keys(results.errors).length;
        
        results.summary = {
            total_files: totalFiles,
            successful: successful,
            failed: failed,
            success_rate: totalFiles > 0 ? `${((successful/totalFiles)*100).toFixed(1)}%` : '0%',
            categories_used: customCategories ? 'Custom' : 'Default',
            processing_time: new Date().toISOString()
        };
        
        if (failed > 0) {
            results.success = false;
        }

        // Get user and store results
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

        // Store batch categorization result
        if (userId && results.success) {
            try {
                const batchData = {
                    user_id: userId,
                    analysis_type: 'batch_categorization',
                    provider: openRouterKey ? 'openrouter' : 'basic',
                    model_used: openRouterKey ? 'mistral-7b-instruct' : 'basic',
                    content: {
                        batch_results: results,
                        files_processed: totalFiles,
                        categories: categories
                    },
                    confidence_score: successful / totalFiles,
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
                    body: JSON.stringify(batchData)
                });
            } catch (dbError) {
                console.warn('Failed to store batch categorization result:', dbError);
            }
        }

        return new Response(JSON.stringify({ data: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Batch categorization error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'BATCH_CATEGORIZATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});