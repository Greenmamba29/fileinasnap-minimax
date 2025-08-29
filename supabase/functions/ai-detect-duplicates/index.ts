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
        const { files, similarityThreshold = 0.9, includeSimilar = true } = await req.json();
        
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

        const duplicateGroups = [];
        const processedFiles = new Set();
        const fileHashes = new Map();

        // First pass: calculate basic hashes and group exact duplicates
        for (const file of files) {
            const { fileName, filePath, content, size, mimeType, hash } = file;
            
            // Use provided hash or create a simple hash based on content/size
            const fileHash = hash || `${fileName}_${size}_${mimeType}`;
            
            if (fileHashes.has(fileHash)) {
                fileHashes.get(fileHash).push(file);
            } else {
                fileHashes.set(fileHash, [file]);
            }
        }

        // Second pass: detect content similarity for files with different hashes
        if (openRouterKey && includeSimilar) {
            try {
                // Group files by type for similarity analysis
                const textFiles = files.filter(f => f.mimeType?.startsWith('text/') || f.content);
                
                // Analyze text-based files for content similarity
                for (let i = 0; i < textFiles.length - 1; i++) {
                    for (let j = i + 1; j < textFiles.length; j++) {
                        const file1 = textFiles[i];
                        const file2 = textFiles[j];
                        
                        if (processedFiles.has(`${file1.fileName}_${file2.fileName}`)) {
                            continue;
                        }
                        
                        processedFiles.add(`${file1.fileName}_${file2.fileName}`);
                        
                        // Skip if already in same hash group
                        const hash1 = file1.hash || `${file1.fileName}_${file1.size}_${file1.mimeType}`;
                        const hash2 = file2.hash || `${file2.fileName}_${file2.size}_${file2.mimeType}`;
                        if (hash1 === hash2) continue;
                        
                        // Analyze content similarity with AI
                        const similarityPrompt = `Compare these two files for content similarity. Rate from 0.0 (completely different) to 1.0 (identical content).

File 1: ${file1.fileName}
Content 1: ${file1.content?.substring(0, 2000) || 'No content'}

File 2: ${file2.fileName}
Content 2: ${file2.content?.substring(0, 2000) || 'No content'}

Provide response as JSON:
{
    "similarity_score": 0.85,
    "similar_elements": ["element1", "element2"],
    "differences": ["diff1", "diff2"],
    "recommendation": "duplicate/similar/different"
}`;

                        try {
                            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${openRouterKey}`,
                                    'Content-Type': 'application/json',
                                    'HTTP-Referer': 'https://fileinasnap.io',
                                    'X-Title': 'FileInASnap AI Duplicate Detection'
                                },
                                body: JSON.stringify({
                                    model: 'mistralai/mistral-7b-instruct',
                                    messages: [{ role: 'user', content: similarityPrompt }],
                                    max_tokens: 1000,
                                    temperature: 0.1
                                })
                            });

                            if (response.ok) {
                                const data = await response.json();
                                const content = data.choices?.[0]?.message?.content || '';
                                
                                try {
                                    const similarity = JSON.parse(content);
                                    if (similarity.similarity_score >= similarityThreshold) {
                                        // Found similar files, group them
                                        const existingGroup = duplicateGroups.find(group => 
                                            group.files.some(f => f.fileName === file1.fileName || f.fileName === file2.fileName));
                                        
                                        if (existingGroup) {
                                            if (!existingGroup.files.some(f => f.fileName === file1.fileName)) {
                                                existingGroup.files.push(file1);
                                            }
                                            if (!existingGroup.files.some(f => f.fileName === file2.fileName)) {
                                                existingGroup.files.push(file2);
                                            }
                                            existingGroup.similarity_details.push(similarity);
                                        } else {
                                            duplicateGroups.push({
                                                files: [file1, file2],
                                                similarity_details: [similarity],
                                                detection_method: 'ai_content_similarity'
                                            });
                                        }
                                    }
                                } catch (parseError) {
                                    console.warn('Failed to parse similarity result:', parseError);
                                }
                            }
                        } catch (aiError) {
                            console.warn('AI similarity check failed:', aiError);
                        }
                    }
                }
            } catch (error) {
                console.warn('Advanced similarity detection failed:', error);
            }
        }

        // Add exact duplicate groups (same hash)
        for (const [hash, fileGroup] of fileHashes.entries()) {
            if (fileGroup.length > 1) {
                duplicateGroups.push({
                    files: fileGroup,
                    similarity_details: [{
                        similarity_score: 1.0,
                        recommendation: 'duplicate',
                        detection_method: 'exact_match'
                    }],
                    detection_method: 'exact_hash_match'
                });
            }
        }

        // Calculate statistics
        let totalDuplicateFiles = 0;
        let totalPotentialSavings = 0;
        
        const formattedGroups = duplicateGroups.map(group => {
            const groupInfo = {
                files: [],
                total_size_mb: 0,
                potential_savings_mb: 0,
                similarity_score: 0,
                detection_method: group.detection_method
            };
            
            // Format file information
            group.files.forEach(file => {
                const sizeInMB = (file.size || 0) / (1024 * 1024);
                groupInfo.files.push({
                    name: file.fileName,
                    path: file.filePath || '',
                    size_mb: parseFloat(sizeInMB.toFixed(2)),
                    mime_type: file.mimeType || 'unknown',
                    hash: file.hash || 'calculated'
                });
                groupInfo.total_size_mb += sizeInMB;
            });
            
            // Calculate potential savings (keep largest file)
            if (groupInfo.files.length > 1) {
                const largestFileSize = Math.max(...groupInfo.files.map(f => f.size_mb));
                groupInfo.potential_savings_mb = parseFloat((groupInfo.total_size_mb - largestFileSize).toFixed(2));
                totalDuplicateFiles += groupInfo.files.length - 1;
                totalPotentialSavings += groupInfo.potential_savings_mb;
            }
            
            // Get similarity score
            if (group.similarity_details && group.similarity_details.length > 0) {
                groupInfo.similarity_score = group.similarity_details[0].similarity_score;
                groupInfo.similarity_details = group.similarity_details;
            }
            
            return groupInfo;
        });

        const result = {
            success: true,
            scan_summary: {
                total_files_scanned: files.length,
                duplicate_groups_found: duplicateGroups.length,
                total_duplicate_files: totalDuplicateFiles,
                similarity_threshold: similarityThreshold,
                total_potential_savings_mb: parseFloat(totalPotentialSavings.toFixed(2)),
                scan_method: openRouterKey ? 'ai_enhanced' : 'basic_hash',
                timestamp: new Date().toISOString()
            },
            duplicate_groups: formattedGroups
        };

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

        // Store duplicate detection result
        if (userId) {
            try {
                const detectionData = {
                    user_id: userId,
                    analysis_type: 'duplicate_detection',
                    provider: openRouterKey ? 'openrouter' : 'basic',
                    model_used: openRouterKey ? 'mistral-7b-instruct' : 'basic',
                    content: {
                        scan_results: result,
                        files_count: files.length,
                        similarity_threshold: similarityThreshold
                    },
                    confidence_score: openRouterKey ? 0.9 : 0.7,
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
                    body: JSON.stringify(detectionData)
                });
            } catch (dbError) {
                console.warn('Failed to store duplicate detection result:', dbError);
            }
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Duplicate detection error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'DUPLICATE_DETECTION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});