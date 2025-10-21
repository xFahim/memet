import { GoogleGenAI } from "@google/genai";

// Types for the structured data we want to extract
export interface AIFillupData {
  entity?: string;
  role?: "hero" | "villain" | "victim" | "other";
  role_explanation?: string;
  entity_2?: string;
  role_2?: "hero" | "villain" | "victim" | "other";
  role_explanation_2?: string;
  humor_explanation?: string;
  context?: string;
  domain?:
    | "politics"
    | "education"
    | "health"
    | "religion"
    | "society"
    | "pop_culture"
    | "economy"
    | "environment"
    | "others";
  image_description?: string;
}

export interface AIFillupResponse {
  success: boolean;
  data?: AIFillupData;
  rawResponse?: string;
  error?: string;
}

export class AIFillupService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Generate AI fillup data from meme image and context
   */
  async generateFillupData(
    imageUrl: string,
    context: string
  ): Promise<AIFillupResponse> {
    try {
      // Create the structured prompt for extracting meme data
      const prompt = this.createStructuredPrompt();

      // Fetch the image data
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString("base64");
      const contentType =
        imageResponse.headers.get("content-type") || "image/jpeg";
      const mimeType = contentType.split(";")[0];

      // Call Gemini API with image and context
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${prompt}\n\nContext from human annotation: ${context}`,
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      });

      const rawResponse = response.text;

      if (!rawResponse) {
        return {
          success: false,
          error: "No response received from AI model",
        };
      }

      // Try to parse the JSON response
      try {
        // First, try to parse the raw response directly
        const parsedData = JSON.parse(rawResponse);
        return {
          success: true,
          data: parsedData,
          rawResponse: rawResponse,
        };
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the response
        try {
          // Look for JSON content between ```json and ``` or just ``` and ```
          const jsonMatch =
            rawResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
            rawResponse.match(/(\{[\s\S]*\})/);

          if (jsonMatch) {
            const jsonString = jsonMatch[1];
            const parsedData = JSON.parse(jsonString);
            return {
              success: true,
              data: parsedData,
              rawResponse: rawResponse,
            };
          } else {
            // If no JSON found, return the raw response
            return {
              success: true,
              rawResponse: rawResponse,
              error: "No valid JSON found in response, showing raw output",
            };
          }
        } catch (extractError) {
          // If extraction also fails, return the raw response
          return {
            success: true,
            rawResponse: rawResponse,
            error: "Failed to parse JSON response, showing raw output",
          };
        }
      }
    } catch (error: any) {
      console.error("AI Fillup Error:", error);
      return {
        success: false,
        error: error.message || "Failed to generate AI fillup data",
      };
    }
  }

  /**
   * Create the structured prompt for extracting meme data
   */
  private createStructuredPrompt(): string {
    return `Analyze this meme image and the provided context to extract structured information. Return your response as a JSON object with the following fields:

{
  "entity": "Primary entity or subject in the meme (person, character, concept, etc.)",
  "role": "hero|villain|victim|other",
  "role_explanation": "Explanation of why this entity has this role",
  "entity_2": "Secondary entity if present (optional)",
  "role_2": "hero|villain|victim|other (only if entity_2 exists)",
  "role_explanation_2": "Explanation for secondary entity's role (only if entity_2 exists)",
  "humor_explanation": "What makes this meme funny? Explain the humor mechanism",
  "context": "Broader context or background information",
  "domain": "politics|education|health|religion|society|pop_culture|economy|environment|others",
  "image_description": "Detailed description of what you see in the image"
}

Guidelines:
- Be specific and detailed in your analysis
- If a secondary entity is not prominent, omit entity_2, role_2, and role_explanation_2
- Choose the most appropriate domain from the provided options
- Focus on the humor mechanism and cultural context
- Provide clear, concise explanations for each field
- Return ONLY the JSON object, no additional text

ROLE SELECTION PRIORITY:
- ALWAYS try to fit entities into hero, villain, or victim roles first
- Only use "other" when the entity clearly doesn't fit hero/villain/victim categories
- Look for clues: heroes are protagonists/positive figures, villains are antagonists/negative figures, victims are those being harmed/mocked
- Avoid defaulting to "other" - analyze the entity's function in the meme context

HUMOR AND CONTEXT FORMAT:
- Humor Explanation: Format as "[Humor Type or Device] [Target/Entity] [Reason for Humor]"
- Context: Format as "[Entity/Event] [Situation/Background] [Relevance to Meme]"
- Use specific, concise entity names (avoid "&" or "and" unless absolutely necessary)
- Be precise and direct in descriptions

Analyze the meme and context now:`;
  }
}

// Factory function to create AIFillupService with specific API key
export const createAIFillupService = (apiKey: string) =>
  new AIFillupService(apiKey);
