
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a placeholder check. The environment variable is expected to be set.
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateCode = async (code: string, prompt: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API key is not configured.");
  }
  
  const fullPrompt = `
    You are an expert programmer AI assistant. Your task is to modify the provided code based on the user's instructions.
    
    **CRITICAL INSTRUCTION:** ONLY return the complete, raw, modified code. Do NOT include any explanations, comments about your changes, apologies, or markdown formatting like \`\`\`javascript or \`\`\`.
    
    **User's Instruction:** "${prompt}"
    
    **Original Code:**
    ---
    ${code}
    ---
    
    **Modified Code:**
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: fullPrompt,
    });
    
    const text = response.text;
    
    // Clean up potential markdown backticks just in case
    return text.replace(/^```[\s\S]*?\n|```$/g, '').trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate code from AI.");
  }
};
