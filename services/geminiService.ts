import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

// Custom error for service-specific issues to be caught by the UI
export class GeminiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("CRITICAL: API_KEY environment variable not set. The application cannot start.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    bugs: {
      type: Type.ARRAY,
      description: "A list of bugs or potential issues found in the code.",
      items: {
        type: Type.OBJECT,
        properties: {
          line: {
            type: Type.NUMBER,
            description: "The line number where the bug is located."
          },
          description: {
            type: Type.STRING,
            description: "A clear description of the bug and why it's a problem."
          },
          severity: {
            type: Type.STRING,
            description: "The severity of the bug (e.g., Critical, High, Medium, Low, Info)."
          }
        },
        required: ["line", "description", "severity"]
      }
    },
    logs: {
      type: Type.ARRAY,
      description: "A list of suggestions for improving logging in the code.",
      items: {
        type: Type.OBJECT,
        properties: {
          line: {
            type: Type.NUMBER,
            description: "The line number where a log could be added or improved."
          },
          suggestion: {
            type: Type.STRING,
            description: "A specific suggestion for what to log and why."
          }
        },
        required: ["line", "suggestion"]
      }
    },
    features: {
      type: Type.ARRAY,
      description: "A high-level summary of the features implemented in the code.",
      items: {
        type: Type.STRING,
        description: "A single feature description."
      }
    }
  },
  required: ["bugs", "logs", "features"]
};


export const analyzeCode = async (code: string): Promise<AnalysisResult> => {
  try {
    const prompt = `
      Analyze the following code snippet. Identify potential bugs, suggest improvements for logging, and summarize the key features.
      Provide your analysis in the specified JSON format. If no bugs, logs, or features are found, return an empty array for the respective key.

      Code:
      \`\`\`
      ${code}
      \`\`\`
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
      throw new GeminiServiceError("The API returned an empty response. This could be due to content filtering or an inability to process the request.");
    }
    
    let parsedResult;
    try {
        parsedResult = JSON.parse(jsonText);
    } catch (parseError) {
        console.error("JSON Parsing Error:", parseError, "Raw Text:", jsonText);
        throw new GeminiServiceError("Failed to parse the response from the API. The returned format was not valid JSON.");
    }

    if (!parsedResult.bugs || !parsedResult.logs || !parsedResult.features) {
        throw new GeminiServiceError("API response is missing one or more required fields (bugs, logs, features). The data structure is incorrect.");
    }

    return parsedResult as AnalysisResult;

  } catch (error) {
    console.error("Error calling Gemini API:", error);

    // Re-throw our custom errors so the UI can handle them
    if (error instanceof GeminiServiceError) {
        throw error;
    }

    // Check for specific error messages from the Gemini SDK
    if (error instanceof Error) {
        if (/API key not valid/i.test(error.message)) {
            throw new GeminiServiceError("The configured Gemini API key is not valid. Please check your environment configuration.");
        }
        if (/fetch/i.test(error.message)) { // A simple way to guess network issues
             throw new GeminiServiceError("A network error occurred while trying to reach the Gemini API. Please check your internet connection.");
        }
    }
    
    // Generic fallback for other errors
    throw new GeminiServiceError(`An unexpected error occurred during analysis. ${error instanceof Error ? error.message : String(error)}`);
  }
};