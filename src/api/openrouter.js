import https from 'https';
import path from 'path';
import { config } from '../config/constants.js';
import { readFileContent, getLanguageFromFile } from '../utils/file-utils.js';
import { cleanCodeResponse } from '../utils/code-cleaner.js';

// Call OpenRouter API as fallback to Cerebras
export async function callOpenRouter(prompt, codeExample = "", outputFile = "", language = null, agentsMd = "") {
  try {
    // Check if OpenRouter API key is available
    if (!config.openRouterApiKey) {
      throw new Error("No OpenRouter API key available. Set OPENROUTER_API_KEY environment variable.");
    }
    
    // Determine language from file extension or explicit parameter
    const detectedLanguage = getLanguageFromFile(outputFile, language);
    
    // Read existing file content (required for edits)
    const existingContent = await readFileContent(outputFile);
    if (!existingContent) {
      throw new Error("File does not exist. This tool only edits existing files.");
    }
    
    // Build a focused prompt for diff-based editing
    let fullPrompt = `Apply the following simple change to the existing ${detectedLanguage} code:

Change to make: ${prompt}

Code example showing what it should look like:
\`\`\`${detectedLanguage}
${codeExample}
\`\`\`

Existing file content:
\`\`\`${detectedLanguage}
${existingContent}
\`\`\`

Code quality guidelines to follow:
${agentsMd}

Apply this change to the existing code and return the complete modified file.`;
    
    const requestData = {
      model: config.openRouterModel,
      messages: [
        {
          role: "system",
          content: `You are an expert programmer. Apply the requested simple code change to the existing file. Return ONLY the complete modified code with no explanations, comments about the change, or markdown formatting. The change should be minimal and focused. Output raw code only. Never use markdown code blocks.`
        },
        {
          role: "user",
          content: fullPrompt
        }
      ],
      provider: {
        order: ['cerebras'],
        allow_fallbacks: false
      },
      temperature: config.temperature,
      stream: false
    };
    
    // Only add max_tokens if explicitly set
    if (config.maxTokens) {
      requestData.max_tokens = config.maxTokens;
    }
    
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestData);
      
      const options = {
        hostname: 'openrouter.ai',
        port: 443,
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': `Bearer ${config.openRouterApiKey}`,
          'HTTP-Referer': config.openRouterSiteUrl,
          'X-Title': config.openRouterSiteName
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200 && response.choices && response.choices[0]) {
              const rawContent = response.choices[0].message.content;
              const cleanedContent = cleanCodeResponse(rawContent);
              resolve(cleanedContent);
            } else {
              reject(new Error(`OpenRouter API error: ${res.statusCode} - ${response.error?.message || 'Unknown error'}`));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse API response: ${parseError.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });
      
      req.write(postData);
      req.end();
    });
  } catch (error) {
    throw new Error(`OpenRouter API call failed: ${error.message}`);
  }
}
