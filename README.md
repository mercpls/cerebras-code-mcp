# Cerebras Code MCP Server v1.4.0

This MCP server is designed for **simple, diff-based code editing** with Cerebras. Use it for quick, non-complex edits like changing colors, variable names, or other small modifications.

It uses the Qwen 3 Coder model and can be embedded in IDEs like Claude Code and Cline, with beta support for Cursor.

## ✨ New in v1.4.0

- **Simplified Editing**: Streamlined to focus on simple, diff-based edits only
- **No More Strict Enforcement**: Less aggressive about forcing tool usage - use it when it makes sense
- **Code Quality via agents.md**: The main LLM provides agents.md content with each request to ensure code quality
- **Cleaner Output**: Removed complex IDE-specific formatting in favor of simple diffs

## 1. Install the NPM Package
```bash
npm install -g cerebras-code-mcp
```

## 2. Get Cerebras API key
Visit [cloud.cerebras.ai](https://cloud.cerebras.ai) and create an API key

[OPTIONAL] Add OpenRouter as a backup in case you hit your Cerebras rate limits
Visit [OpenRouter](https://openrouter.ai/) and get a key to use as a fallback provider.

You can set this key in your MCP settings under OPENROUTER_API_KEY, and it will trigger automatically if anything goes wrong with calling Cerebras.


## 3. Run the Setup Wizard for Claude Code / Cursor / Cline / VS Code (Copilot)
```bash
cerebras-mcp --config
```

Use the setup wizard to configure the tool on your machine.

If you're using Cursor, it will ask you to copy and paste a prompt into your Cursor User Rules.

## 4. Removal/Cleanup (Optional)
```bash
cerebras-mcp --remove
```

Use the removal wizard to clean up configurations for any IDE or perform a complete cleanup.

## 5. Usage

The MCP tool appears as `write` in your tool list. It's designed for simple, focused edits:

**Use cases:**
- Changing a color value in a config file
- Updating a variable name
- Modifying a simple string or number
- Other small, non-complex changes

**How it works:**
- The main LLM provides a small prompt describing the change
- A code example showing what the change should look like
- The agents.md content for code quality guidelines
- The tool applies the diff-based change to the existing file

**What it's NOT for:**
- Creating new files (only edits existing files)
- Complex code generation
- Large-scale refactoring

Example usage:
```
Use the cerebras-mcp write tool to change the primary color from #0066cc to #ff6600 in src/config.js
```