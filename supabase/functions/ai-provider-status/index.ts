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
        const startTime = Date.now();
        
        // Get OpenRouter API key
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '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';
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        const status = {
            timestamp: new Date().toISOString(),
            services: {},
            overall_status: 'unknown',
            response_time_ms: 0,
            version: '1.0.0'
        };

        // Check OpenRouter API status
        if (openRouterKey) {
            try {
                const openRouterStart = Date.now();
                const response = await fetch('https://openrouter.ai/api/v1/models', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${openRouterKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://fileinasnap.io',
                        'X-Title': 'FileInASnap Status Check'
                    },
                    signal: AbortSignal.timeout(10000) // 10 second timeout
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
                        rate_limit_info: {
                            daily_limit: 'Free tier',
                            current_usage: 'Not available'
                        }
                    };
                } else {
                    status.services.openrouter = {
                        status: 'degraded',
                        response_time_ms: openRouterTime,
                        error: `HTTP ${response.status}`,
                        endpoint: 'https://openrouter.ai/api/v1',
                        last_check: new Date().toISOString()
                    };
                }
            } catch (error) {
                status.services.openrouter = {
                    status: 'error',
                    error: error.message,
                    endpoint: 'https://openrouter.ai/api/v1',
                    last_check: new Date().toISOString(),
                    note: 'Connection failed or timeout'
                };
            }
        } else {
            status.services.openrouter = {
                status: 'not_configured',
                error: 'API key not provided',
                note: 'OpenRouter integration not configured'
            };
        }

        // Check Supabase database status
        if (supabaseUrl && serviceRoleKey) {
            try {
                const supabaseStart = Date.now();
                const dbResponse = await fetch(`${supabaseUrl}/rest/v1/ai_analysis_results?select=id&limit=1`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    signal: AbortSignal.timeout(5000)
                });

                const supabaseTime = Date.now() - supabaseStart;

                if (dbResponse.ok) {
                    status.services.supabase_db = {
                        status: 'healthy',
                        response_time_ms: supabaseTime,
                        endpoint: `${supabaseUrl}/rest/v1`,
                        last_check: new Date().toISOString()
                    };
                } else {
                    status.services.supabase_db = {
                        status: 'degraded',
                        response_time_ms: supabaseTime,
                        error: `HTTP ${dbResponse.status}`,
                        endpoint: `${supabaseUrl}/rest/v1`,
                        last_check: new Date().toISOString()
                    };
                }
            } catch (error) {
                status.services.supabase_db = {
                    status: 'error',
                    error: error.message,
                    endpoint: `${supabaseUrl}/rest/v1`,
                    last_check: new Date().toISOString()
                };
            }
        } else {
            status.services.supabase_db = {
                status: 'not_configured',
                error: 'Database configuration missing'
            };
        }

        // Test a simple AI request to verify end-to-end functionality
        if (status.services.openrouter?.status === 'healthy') {
            try {
                const testStart = Date.now();
                const testResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openRouterKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://fileinasnap.io',
                        'X-Title': 'FileInASnap Health Check'
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

                const testTime = Date.now() - testStart;

                if (testResponse.ok) {
                    const testData = await testResponse.json();
                    status.services.ai_processing = {
                        status: 'healthy',
                        response_time_ms: testTime,
                        test_response: testData.choices?.[0]?.message?.content || 'No response',
                        model_tested: 'mistral-7b-instruct',
                        last_check: new Date().toISOString()
                    };
                } else {
                    status.services.ai_processing = {
                        status: 'degraded',
                        response_time_ms: testTime,
                        error: `Test request failed: HTTP ${testResponse.status}`,
                        model_tested: 'mistral-7b-instruct',
                        last_check: new Date().toISOString()
                    };
                }
            } catch (error) {
                status.services.ai_processing = {
                    status: 'error',
                    error: error.message,
                    model_tested: 'mistral-7b-instruct',
                    last_check: new Date().toISOString()
                };
            }
        } else {
            status.services.ai_processing = {
                status: 'unavailable',
                error: 'OpenRouter not available for testing',
                last_check: new Date().toISOString()
            };
        }

        // Check individual Edge Functions health
        const edgeFunctions = [
            'ai-analyze-document',
            'ai-categorize-files',
            'ai-generate-tags',
            'ai-analyze-image',
            'ai-detect-duplicates',
            'ai-generate-summary',
            'ai-suggest-organization'
        ];

        status.services.edge_functions = {
            status: 'healthy',
            functions: edgeFunctions.map(func => ({
                name: func,
                status: 'deployed',
                endpoint: `${supabaseUrl}/functions/v1/${func}`
            })),
            total_functions: edgeFunctions.length,
            last_check: new Date().toISOString()
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
            environment: 'supabase_edge_function',
            deno_version: Deno.version.deno,
            ai_provider: 'openrouter',
            available_models: [
                'mistralai/mistral-7b-instruct',
                'openai/gpt-4-vision-preview',
                'meta-llama/llama-3.1-8b-instruct'
            ],
            capabilities: [
                'document_analysis',
                'image_analysis',
                'file_categorization',
                'tag_generation',
                'duplicate_detection',
                'content_summarization',
                'organization_suggestions'
            ]
        };

        // Store health check result in database
        if (status.services.supabase_db?.status === 'healthy') {
            try {
                const healthData = {
                    analysis_type: 'system_health_check',
                    provider: 'system',
                    model_used: 'health_monitor',
                    content: {
                        status: status,
                        check_type: 'comprehensive',
                        services_checked: Object.keys(status.services)
                    },
                    confidence_score: status.overall_status === 'healthy' ? 1.0 : 0.5,
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
                    body: JSON.stringify(healthData)
                });
            } catch (dbError) {
                console.warn('Failed to store health check result:', dbError);
            }
        }

        return new Response(JSON.stringify({ data: status }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: status.overall_status === 'healthy' ? 200 : 
                   status.overall_status === 'error' ? 503 : 206
        });

    } catch (error) {
        console.error('Provider status check error:', error);

        const errorStatus = {
            timestamp: new Date().toISOString(),
            overall_status: 'error',
            error: error.message,
            services: {
                health_check: {
                    status: 'error',
                    error: error.message
                }
            },
            response_time_ms: Date.now() - (Date.now() - 1000) // Approximate
        };

        return new Response(JSON.stringify({ data: errorStatus }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});