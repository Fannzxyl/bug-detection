import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

// Custom error for service-specific issues to be caught by the UI
export class GeminiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}

// FIX: Initialize with process.env.API_KEY directly and remove manual check.
// The environment variable is assumed to be configured and valid.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema descriptions are for the model's structural understanding and can remain in English.
// The natural language instruction in the prompt will handle the localization of the content.
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    bugs: {
      type: Type.ARRAY,
      description: "A list of bugs or potential issues found in the code.",
      items: {
        type: Type.OBJECT,
        properties: {
          line: { type: Type.NUMBER, description: "The line number where the bug is located." },
          description: { type: Type.STRING, description: "A clear description of the bug and why it's a problem." },
          severity: { type: Type.STRING, description: "The severity of the bug (e.g., Critical, High, Medium, Low, Info)." }
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
          line: { type: Type.NUMBER, description: "The line number where a log could be added or improved." },
          suggestion: { type: Type.STRING, description: "A specific suggestion for what to log and why." }
        },
        required: ["line", "suggestion"]
      }
    },
    features: {
      type: Type.ARRAY,
      description: "A detailed catalog of features implemented or implied in the code, following specific heuristics.",
      items: {
        type: Type.OBJECT,
        properties: {
          featureId: { type: Type.STRING, description: "A short, machine-readable ID for the feature (e.g., 'userAuth', 'itemUom')." },
          name: { type: Type.STRING, description: "A human-readable name for the feature (e.g., 'User Authentication')." },
          status: { type: Type.STRING, description: "The implementation status: 'implemented' (fully present), 'partial' (some parts missing), or 'stub' (placeholder)." },
          description: { type: Type.STRING, description: "A brief summary of what the feature does." },
          ui: {
            type: Type.OBJECT,
            properties: {
              routes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Associated UI routes (e.g., '/settings/profile'). For non-web apps, this can be empty." },
              components: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key UI components involved. For non-web apps, this can be empty." },
            },
            required: ["routes", "components"]
          },
          api: {
            type: Type.OBJECT,
            properties: {
              endpoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Associated API endpoints (e.g., 'GET /api/users/:id') or public functions/methods for libraries." },
            },
             required: ["endpoints"]
          },
          data: {
            type: Type.OBJECT,
            properties: {
              models: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Data models, classes, or database tables related to this feature." },
            },
             required: ["models"]
          },
          risks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Potential risks or implementation gaps, like missing validation or security checks."
          },
          evidence: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Specific lines of code or artifacts that justify the feature's existence."
          }
        },
        required: ["featureId", "name", "status", "description", "ui", "api", "data", "risks", "evidence"]
      }
    }
  },
  required: ["bugs", "logs", "features"]
};


export const analyzeCode = async (code: string, language: 'en' | 'id'): Promise<AnalysisResult> => {
  try {
    const languageInstruction = language === 'id'
      ? 'PENTING: Berikan semua deskripsi, saran, tingkat keparahan, nama fitur, dan semua string lain yang akan dilihat pengguna dalam Bahasa Indonesia.'
      : 'IMPORTANT: Provide all descriptions, suggestions, severities, feature names, and any other user-facing strings in English.';

    const prompt = `
      As an expert polyglot software engineer, first, automatically identify the programming language of the code snippet provided below.

      Then, based on the identified language, conduct a comprehensive analysis with three parts:
      1.  **Potential Bugs:** Identify potential bugs, logical errors, or deviations from language-specific best practices.
      2.  **Logging Suggestions:** Suggest improvements for logging to enhance observability and debugging, following conventions for that language.
      3.  **Feature Discovery:** Catalog the high-level features or modules within the code.
      
      ${languageInstruction}

      **Feature Discovery Rules (Adapt to the Language):**
      - **Goal**: Identify and catalog all features, modules, or key components.
      - **Heuristics**: Look for architectural patterns, primary classes, public functions, data structures/models, and domain-specific keywords. For web applications, this includes UI routes and API endpoints. For libraries, it includes the public API. For standalone scripts, it includes the main execution blocks.
      - **Status**: Mark a feature 'implemented' if it seems complete, 'partial' if key parts are missing, or 'stub' if it's just a placeholder.
      - **Risks**: Identify potential issues like missing error handling, security vulnerabilities (e.g., lack of input validation), or performance bottlenecks.
      - **Evidence**: Quote a brief snippet of code that proves the feature's existence.

      Provide your complete analysis in the specified JSON format. If no items are found for a category (bugs, logs, or features), return an empty array for that key.

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
        temperature: 0.1,
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