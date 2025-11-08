import { createPatch } from 'diff';
import path from 'path';
import { getLanguageFromFile } from '../utils/file-utils.js';

// Get simple formatting preferences
function getSimpleFormatting() {
  return {
    useColors: false,
    useLineNumbers: false,
    useEmojis: false,
    maxPreviewLines: 50,
    showSummary: true,
    diffStyle: 'simple'
  };
}

// Format diff line for simple display
function formatDiffLine(line, lineNumber, type, formatting, language) {
  let symbol = '';
  
  switch (type) {
    case 'add':
      symbol = '+';
      break;
    case 'remove':
      symbol = '-';
      break;
    case 'context':
      symbol = ' ';
      break;
  }
  
  return `${symbol} ${line}`;
}

export function formatEditResponse(fileName, existingContent, newContent, filePath) {
  const formatting = getSimpleFormatting();
  const language = getLanguageFromFile(filePath);
  
  // Use the diff library to get a proper diff
  const patch = createPatch(fileName, existingContent, newContent);
  const patchLines = patch.split('\n');
  
  // Count additions and removals
  let additions = 0;
  let removals = 0;
  let formattedDiff = [];
  
  // Parse the patch to extract changes and line numbers
  let lineNumber = 0;
  let inHunk = false;
  
  for (const line of patchLines) {
    if (line.startsWith('@@')) {
      // Extract starting line number from hunk header
      const match = line.match(/@@ -\d+,?\d* \+(\d+)/);
      if (match) {
        lineNumber = parseInt(match[1]);
        inHunk = true;
      }
    } else if (inHunk) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++;
        const codeLine = line.substring(1);
        formattedDiff.push(formatDiffLine(codeLine, lineNumber, 'add', formatting, language));
        lineNumber++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        removals++;
        const codeLine = line.substring(1);
        formattedDiff.push(formatDiffLine(codeLine, lineNumber, 'remove', formatting, language));
        // Don't increment line number for removals
      } else if (line.startsWith(' ') || line === '') {
        // Context line (starts with space) - only show in non-minimal mode
        if (formatting.diffStyle !== 'minimal') {
          const contextLine = line.startsWith(' ') ? line.substring(1) : line;
          formattedDiff.push(formatDiffLine(contextLine, lineNumber, 'context', formatting, language));
        }
        lineNumber++;
      }
    }
  }

  if (formattedDiff.length > 0) {
    // Truncate if too long
    if (formattedDiff.length > formatting.maxPreviewLines) {
      const keepLines = Math.floor(formatting.maxPreviewLines / 2);
      const hiddenCount = formattedDiff.length - (keepLines * 2);
      formattedDiff = [
        ...formattedDiff.slice(0, keepLines),
        `... ${hiddenCount} lines hidden ...`,
        ...formattedDiff.slice(-keepLines)
      ];
    }
    
    let header = `Edited ${fileName}`;
    let summary = '';
    
    if (formatting.showSummary) {
      summary = `${additions} addition${additions !== 1 ? 's' : ''}, ${removals} removal${removals !== 1 ? 's' : ''}`;
    }
    
    const parts = [header];
    if (summary) parts.push(summary);
    parts.push(formattedDiff.join('\n'));
    
    return {
      type: "text",
      text: parts.join('\n')
    };
  }
  
  return null;
}
