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
        const { files, currentStructure, organizationGoals } = await req.json();
        
        if (!files || !Array.isArray(files) || files.length === 0) {
            throw new Error('Files array is required');
        }

        // Get OpenRouter API key
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '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';
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Analyze file patterns and types
        const fileAnalysis = {
            total_files: files.length,
            file_types: {},
            size_distribution: {},
            name_patterns: [],
            content_categories: new Set(),
            date_patterns: []
        };

        // Analyze files
        files.forEach(file => {
            const { fileName, mimeType, size, content, tags, category } = file;
            
            // Count file types
            const type = mimeType?.split('/')[0] || 'unknown';
            fileAnalysis.file_types[type] = (fileAnalysis.file_types[type] || 0) + 1;
            
            // Size distribution
            const sizeCategory = size > 50 * 1024 * 1024 ? 'large' : 
                               size > 10 * 1024 * 1024 ? 'medium' : 'small';
            fileAnalysis.size_distribution[sizeCategory] = (fileAnalysis.size_distribution[sizeCategory] || 0) + 1;
            
            // Extract name patterns
            const nameWords = fileName.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(w => w.length > 2);
            fileAnalysis.name_patterns.push(...nameWords);
            
            // Categories from tags and content
            if (category) fileAnalysis.content_categories.add(category);
            if (tags) tags.forEach(tag => fileAnalysis.content_categories.add(tag));
        });

        // Convert Set to Array
        fileAnalysis.content_categories = Array.from(fileAnalysis.content_categories);
        
        // Count word frequencies
        const wordCounts = {};
        fileAnalysis.name_patterns.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
        
        // Get most common words (potential folder names)
        const commonWords = Object.entries(wordCounts)
            .filter(([word, count]) => count > 1)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);

        // Create organization analysis prompt
        const analysisPrompt = `Analyze this file collection and suggest an optimal folder organization structure.

File Analysis:
- Total Files: ${fileAnalysis.total_files}
- File Types: ${JSON.stringify(fileAnalysis.file_types, null, 2)}
- Size Distribution: ${JSON.stringify(fileAnalysis.size_distribution, null, 2)}
- Common Name Patterns: ${commonWords.join(', ')}
- Content Categories: ${fileAnalysis.content_categories.slice(0, 15).join(', ')}

Current Structure: ${currentStructure || 'No current structure provided'}
Organization Goals: ${organizationGoals || 'General productivity and accessibility'}

Provide suggestions in JSON format:
{
    "recommended_structure": {
        "folder_name_1": {
            "description": "Purpose of this folder",
            "file_types": ["types that belong here"],
            "suggested_files": ["specific files to move here"],
            "subfolders": ["subfolder1", "subfolder2"]
        }
    },
    "organization_principles": ["principle1", "principle2"],
    "quick_wins": [
        {
            "action": "Create 'Documents' folder",
            "files_affected": 15,
            "benefit": "Groups all text-based files"
        }
    ],
    "naming_conventions": {
        "files": "Suggested file naming pattern",
        "folders": "Suggested folder naming pattern"
    },
    "maintenance_tips": ["tip1", "tip2"],
    "estimated_time_to_organize": "2-3 hours",
    "confidence": 0.92
}`;

        let organizationSuggestions = null;
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
                        'X-Title': 'FileInASnap AI Organization Suggestions'
                    },
                    body: JSON.stringify({
                        model: 'mistralai/mistral-7b-instruct',
                        messages: [{ role: 'user', content: analysisPrompt }],
                        max_tokens: 2500,
                        temperature: 0.2
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const aiContent = data.choices?.[0]?.message?.content || '';
                    
                    try {
                        organizationSuggestions = JSON.parse(aiContent);
                        provider = 'openrouter';
                        modelUsed = 'mistral-7b-instruct';
                    } catch {
                        // Fallback to structured text response
                        organizationSuggestions = {
                            raw_response: aiContent,
                            confidence: 0.7,
                            note: 'AI response could not be parsed as JSON'
                        };
                        provider = 'openrouter';
                        modelUsed = 'mistral-7b-instruct';
                    }
                } else {
                    throw new Error(`OpenRouter API error: ${response.status}`);
                }
            } catch (error) {
                console.warn('OpenRouter error for organization suggestions:', error);
                // Create basic fallback suggestions
                organizationSuggestions = createBasicOrganizationSuggestions(fileAnalysis);
            }
        } else {
            // Basic organization suggestions without API
            organizationSuggestions = createBasicOrganizationSuggestions(fileAnalysis);
        }

        // Function to create basic organization suggestions
        function createBasicOrganizationSuggestions(analysis) {
            const suggestions = {
                recommended_structure: {},
                organization_principles: [
                    'Group files by type and purpose',
                    'Use descriptive folder names',
                    'Keep frequently used files accessible',
                    'Archive old files separately'
                ],
                quick_wins: [],
                confidence: 0.6,
                note: openRouterKey ? 'Basic suggestions - AI analysis unavailable' : 'Basic suggestions - OpenRouter API key not configured'
            };

            // Create folders based on file types
            Object.entries(analysis.file_types).forEach(([type, count]) => {
                if (count > 2) {
                    const folderName = type.charAt(0).toUpperCase() + type.slice(1) + 's';
                    suggestions.recommended_structure[folderName] = {
                        description: `All ${type} files organized in one place`,
                        file_types: [type],
                        suggested_files: [],
                        estimated_files: count
                    };
                    
                    suggestions.quick_wins.push({
                        action: `Create '${folderName}' folder`,
                        files_affected: count,
                        benefit: `Organizes all ${type} files`
                    });
                }
            });

            // Add common organizational folders
            if (analysis.total_files > 20) {
                suggestions.recommended_structure['Archive'] = {
                    description: 'Older files and completed projects',
                    file_types: ['all'],
                    subfolders: ['2023', '2024', 'Old Projects']
                };
            }

            return suggestions;
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

        // Store organization suggestions result
        if (userId && organizationSuggestions) {
            try {
                const suggestionData = {
                    user_id: userId,
                    analysis_type: 'organization_suggestions',
                    provider: provider,
                    model_used: modelUsed,
                    content: {
                        file_analysis: fileAnalysis,
                        suggestions: organizationSuggestions,
                        current_structure: currentStructure,
                        organization_goals: organizationGoals
                    },
                    confidence_score: organizationSuggestions.confidence || 0.6,
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
                    body: JSON.stringify(suggestionData)
                });
            } catch (dbError) {
                console.warn('Failed to store organization suggestions result:', dbError);
            }
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                file_analysis: fileAnalysis,
                organization_suggestions: organizationSuggestions,
                provider: provider,
                model_used: modelUsed,
                timestamp: new Date().toISOString(),
                parameters: {
                    files_analyzed: files.length,
                    current_structure: currentStructure,
                    organization_goals: organizationGoals
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Organization suggestion error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'ORGANIZATION_SUGGESTION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});