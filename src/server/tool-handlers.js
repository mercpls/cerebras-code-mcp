import path from 'path';
import { debugLog } from '../config/constants.js';
import { readFileContent, writeFileContent } from '../utils/file-utils.js';
import { cleanCodeResponse } from '../utils/code-cleaner.js';
import { routeAPICall } from '../api/router/router.js';
import { formatEditResponse } from '../formatting/response-formatter.js';

// Tool handler for the write tool
export async function handleWriteTool(args) {
  try {
    // Get IDE identification from environment variable
    const ideSource = process.env.CEREBRAS_MCP_IDE || 'unknown';
    
    await debugLog('=== MCP REQUEST DEBUG ===');
    await debugLog(`IDE Source: ${ideSource}`);
    await debugLog(`Tool called: write`);
    await debugLog(`Arguments: ${JSON.stringify(args, null, 2)}`);
    await debugLog('========================');
    
    const { 
      file_path,
      prompt, 
      code_example,
      agents_md
    } = args;
    
    if (!prompt) {
      throw new Error("Prompt is required for write tool");
    }
    
    if (!file_path) {
      throw new Error("file_path is required for write tool");
    }

    if (!code_example) {
      throw new Error("code_example is required for write tool");
    }

    if (!agents_md) {
      throw new Error("agents_md is required for write tool");
    }
    
    // Check if file exists - this tool only edits existing files
    const existingContent = await readFileContent(file_path);
    if (existingContent === null) {
      throw new Error(`File ${file_path} does not exist. This tool only edits existing files.`);
    }
    
    await debugLog('=== FILE OPERATION DEBUG ===');
    await debugLog(`File path: ${file_path}`);
    await debugLog(`Existing content length: ${existingContent.length}`);
    await debugLog('============================');
    
    // Route API call to apply the diff-based change with agents.md for quality
    const result = await routeAPICall(prompt, code_example, file_path, null, agents_md);
    
    // Clean the AI response to remove markdown formatting
    const cleanResult = cleanCodeResponse(result);

    // Write the cleaned result to the file
    await writeFileContent(file_path, cleanResult);

    // Format the response
    let responseContent = [];
    const fileName = path.basename(file_path);

    // Clean the existing content too for consistent comparison
    const cleanExistingContent = cleanCodeResponse(existingContent);
    const editResponse = formatEditResponse(fileName, cleanExistingContent, cleanResult, file_path);
    if (editResponse) {
      responseContent.push(editResponse);
    }
    
    const response = {
      content: responseContent
    };
    
    // Log the full response for debugging
    await debugLog('=== MCP RESPONSE DEBUG ===');
    await debugLog(`IDE Source: ${ideSource}`);
    await debugLog('Response type: Diff-based edit');
    await debugLog(`Number of content items: ${responseContent.length}`);
    await debugLog(`Response structure: ${JSON.stringify(response, null, 2)}`);
    await debugLog('=========================');
    
    return response;
  } catch (error) {
    // Get IDE identification from environment variable (in case of error)
    const ideSource = process.env.CEREBRAS_MCP_IDE || 'unknown';
    
    await debugLog('=== MCP ERROR DEBUG ===');
    await debugLog(`IDE Source: ${ideSource}`);
    await debugLog(`Error occurred: ${error.message}`);
    await debugLog('=======================');
    
    // Return a standard text error if something goes wrong
    return {
      content: [{
        type: "text",
        text: `Error in cerebras-mcp server: ${error.message}`
      }]
    };
  }
}
