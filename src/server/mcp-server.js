import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { handleWriteTool } from './tool-handlers.js';

// Create MCP server for simple diff-based edits
export const server = new Server({
  name: "cerebras-mcp",
  version: "1.0.0",
  description: "Simple diff-based code editing server for quick, non-complex changes",
  usage: "This MCP server provides a 'write' tool for applying simple code changes via diffs. Use for basic edits like changing colors, variable names, or other simple modifications."
}, {
  capabilities: {
    tools: {}
  },
  system_instructions: `This environment provides a 'write' tool for simple, diff-based code editing.

Use this tool for basic, non-complex edits when you have a clear code example of what should be done.

The tool expects:
- A clear description of the simple change to make
- A code example showing what the change should look like
- The agents.md content for code quality guidelines

This tool is designed for quick edits, not complex code generation.`
});

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "write",
        description: "Apply simple, diff-based code changes to a file.\n\nUse this tool for basic edits when you have a code example showing what should be changed.\n\nThis tool is designed for non-complex edits like:\n- Changing a color value\n- Updating a variable name\n- Modifying a simple configuration\n- Other small, focused changes\n\nThe tool will use the provided agents.md content to ensure code quality.",
        inputSchema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "REQUIRED: Absolute path to the file to edit (e.g., '/Users/username/project/file.py')."
            },
            prompt: {
              type: "string",
              description: "REQUIRED: A small, focused description of the simple change to make (e.g., 'change the primary color from blue to red')."
            },
            code_example: {
              type: "string",
              description: "REQUIRED: A code snippet showing what the change should look like. This should be a small example that demonstrates the edit."
            },
            agents_md: {
              type: "string",
              description: "REQUIRED: Content from the agents.md file with code quality guidelines. The main LLM should provide this to ensure quality on small edits."
            }
          },
          required: ["file_path", "prompt", "code_example", "agents_md"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "write") {
    return await handleWriteTool(request.params.arguments);
  } else {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

export async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}
