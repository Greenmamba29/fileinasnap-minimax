// Netlify Function: AI Tag Generation
// This function generates intelligent tags for files using OpenRouter

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
    const { 
      fileName, 
      filePath, 
      mimeType, 
      content, 
      metadata, 
      maxTags = 10, 
      tagCategories 
    } = JSON.parse(event.body);
    
    if (!fileName) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Filename is required' }),
      };
    }

    // Get environment variables
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    
    console.log('🏷️ Generating tags for:', fileName);

    // Create tag generation prompt
    let analysisPrompt = `Generate intelligent tags for this file based on the provided information.

Filename: ${fileName}`;

    if (filePath) {
      analysisPrompt += `\nFile Path: ${filePath}`;
    }
    
    if (mimeType) {
      analysisPrompt += `\nMIME Type: ${mimeType}`;
    }
    
    if (content) {
      const truncatedContent = content.length > 2000 
        ? content.substring(0, 2000) + '...'
        : content;
      analysisPrompt += `\nContent Preview: ${truncatedContent}`;
    }
    
    if (metadata) {
      analysisPrompt += `\nMetadata: ${JSON.stringify(metadata)}`;
    }

    analysisPrompt += `

Generate up to ${maxTags} relevant, specific tags that would help categorize and find this file.`;

    if (tagCategories && tagCategories.length > 0) {
      analysisPrompt += `\nPreferred categories: ${tagCategories.join(', ')}`;
    }

    analysisPrompt += `

Respond with a JSON object in this format:
{
    "tags": ["tag1", "tag2", "tag3"],
    "confidence": 0.85,
    "category_tags": {
        "type": ["document", "pdf"],
        "topic": ["business", "report"],
        "context": ["quarterly", "financial"]
    },
    "reasoning": "Brief explanation of tag selection"
}`;

    let tagResult = null;
    let provider = 'basic';
    let modelUsed = 'basic';

    if (openRouterKey) {
      try {
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://fileinasnap-v1.netlify.app',
            'X-Title': 'FileInASnap AI Tag Generation'
          },
          body: JSON.stringify({
            model: 'mistralai/mistral-7b-instruct',
            messages: [{ role: 'user', content: analysisPrompt }],
            max_tokens: 1000,
            temperature: 0.2
          }),
          signal: AbortSignal.timeout(20000)
        });

        if (openRouterResponse.ok) {
          const data = await openRouterResponse.json();
          const content = data.choices?.[0]?.message?.content || '';
          
          try {
            // Try to parse as JSON
            tagResult = JSON.parse(content);
            provider = 'openrouter';
            modelUsed = 'mistral-7b-instruct';
            console.log('✅ OpenRouter tag generation successful');
          } catch {
            // Extract tags from text response if JSON parsing fails
            const tagMatches = content.match(/["']([^"']+)["']/g);
            const extractedTags = tagMatches 
              ? tagMatches.map(match => match.replace(/["']/g, ''))
              : [];
            
            tagResult = {
              tags: extractedTags.slice(0, maxTags),
              confidence: 0.6,
              reasoning: 'Extracted from AI response text',
              source: 'openrouter_text_extraction'
            };
            provider = 'openrouter';
            modelUsed = 'mistral-7b-instruct';
          }
        } else {
          throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
        }
      } catch (error) {
        console.warn('OpenRouter API error, using fallback:', error);
        tagResult = null; // Will trigger fallback below
      }
    }

    // Fallback tag generation if OpenRouter failed or not configured
    if (!tagResult) {
      const fallbackTags = [];
      
      // Extract tags from filename
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      if (fileExtension) {
        fallbackTags.push(fileExtension);
      }
      
      // Add MIME type based tags
      if (mimeType) {
        const mimeCategory = mimeType.split('/')[0];
        fallbackTags.push(mimeCategory);
        
        if (mimeType.includes('pdf')) fallbackTags.push('pdf', 'document');
        if (mimeType.includes('image')) fallbackTags.push('image', 'visual');
        if (mimeType.includes('video')) fallbackTags.push('video', 'media');
        if (mimeType.includes('audio')) fallbackTags.push('audio', 'media');
        if (mimeType.includes('text')) fallbackTags.push('text', 'document');
      }
      
      // Extract meaningful words from filename
      const nameWords = fileName
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/[_-]/g, ' ')    // Replace underscores/hyphens with spaces
        .toLowerCase()
        .split(' ')
        .filter(word => word.length > 2);
      
      fallbackTags.push(...nameWords);
      
      // Add content-based tags if available
      if (content) {
        const contentWords = content
          .toLowerCase()
          .match(/\b[a-zA-Z]{4,}\b/g) || [];
        
        // Get most common words
        const wordCount = {};
        contentWords.forEach(word => {
          wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        const commonWords = Object.entries(wordCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([word]) => word);
        
        fallbackTags.push(...commonWords);
      }
      
      // Remove duplicates and limit to maxTags
      const uniqueTags = [...new Set(fallbackTags)].slice(0, maxTags);
      
      tagResult = {
        tags: uniqueTags,
        confidence: 0.5,
        category_tags: {
          type: uniqueTags.filter(tag => 
            ['pdf', 'doc', 'txt', 'image', 'video', 'audio'].includes(tag)
          ),
          extracted: uniqueTags.filter(tag => nameWords.includes(tag))
        },
        reasoning: 'Generated using filename and metadata analysis',
        source: 'fallback_analysis'
      };
      
      provider = 'fallback';
      modelUsed = 'basic';
      console.log('📝 Fallback tag generation completed');
    }

    const response = {
      data: {
        success: true,
        fileName: fileName,
        tags: tagResult.tags || [],
        confidence: tagResult.confidence || 0.5,
        categoryTags: tagResult.category_tags || {},
        reasoning: tagResult.reasoning || 'Tags generated based on file analysis',
        provider: provider,
        modelUsed: modelUsed,
        timestamp: new Date().toISOString(),
        metadata: {
          originalRequest: {
            fileName,
            mimeType,
            hasContent: !!content,
            maxTags
          }
        }
      }
    };

    console.log('🎉 Tag generation completed successfully');

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('💥 Tag generation error:', error);

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: {
          code: 'TAG_GENERATION_FAILED',
          message: error.message
        }
      }),
    };
  }
};
