import { createOpenAI } from "@ai-sdk/openai";
import { type LanguageModelV1 } from "ai";
import { createOllama } from "ollama-ai-provider";


export function modelPicker(
  modelProvider: string,
  modelId?: string,
): LanguageModelV1 {
  if (modelProvider === "ollama" && modelId) {
    
    const ollama = createOllama();
    return ollama(modelId) as unknown as LanguageModelV1;
  }

  if (modelProvider === "lmstudio" && modelId) {
    
    const lmstudio = createOpenAI({
      name: "lmstudio",
      baseURL: "http://localhost:1234/v1",
      apiKey: "lmstudio",
    });
    return lmstudio(modelId) as unknown as LanguageModelV1;
  }

  
  const openai = createOpenAI();
  return openai("gpt-4o-mini") as unknown as LanguageModelV1;
}
