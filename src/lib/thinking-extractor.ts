

export interface ThinkingResult {
  thinking: string;
  content: string;
  hasThinking: boolean;
}


export function extractThinking(response: string): ThinkingResult {
  
  const thinkStartPattern = /^<think>/i;
  const thinkEndPattern = /<\/think>/i;

  if (!thinkStartPattern.test(response)) {
    return {
      thinking: "",
      content: response,
      hasThinking: false,
    };
  }

  
  const endMatch = response.match(thinkEndPattern);
  if (!endMatch) {
    
    return {
      thinking: response,
      content: "",
      hasThinking: true,
    };
  }

  
  const thinkingEndIndex = endMatch.index! + endMatch[0].length;
  const thinkingContent = response.substring(0, thinkingEndIndex);

  
  const remainingContent = response.substring(thinkingEndIndex).trim();

  return {
    thinking: thinkingContent,
    content: remainingContent,
    hasThinking: true,
  };
}


export function removeThinkingTags(content: string): string {
  return content.replace(/^<think>[\s\S]*?<\/think>/i, "").trim();
}


export function startsWithThinking(content: string): boolean {
  return /^<think>/i.test(content);
}
