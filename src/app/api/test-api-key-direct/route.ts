import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Validate key format (basic validation)
    if (!apiKey.startsWith("AIza") || apiKey.length < 30) {
      return NextResponse.json(
        {
          error:
            "Invalid API key format. Gemini keys should start with 'AIza' and be at least 30 characters long.",
        },
        { status: 400 }
      );
    }

    console.log(
      `[TEST-API-KEY-DIRECT] Testing API key: ${apiKey.substring(
        0,
        10
      )}...${apiKey.substring(apiKey.length - 4)}`
    );

    // Test the key using GoogleGenAI SDK
    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Explain how AI works in a few words",
      });

      const responseText = response.text;

      return NextResponse.json({
        message: `✅ API key is working! Response: "${responseText}"`,
        success: true,
        response: responseText,
        model: "gemini-2.5-flash",
        keyPreview: `${apiKey.substring(0, 10)}...${apiKey.substring(
          apiKey.length - 4
        )}`,
      });
    } catch (apiError: any) {
      console.error("Gemini API test error:", apiError);

      // Handle specific error cases
      const errorCode = apiError.code;
      const errorMessage = apiError.message || apiError.toString();

      if (
        errorCode === 400 ||
        errorMessage.includes("API_KEY_INVALID") ||
        errorMessage.includes("invalid API key")
      ) {
        return NextResponse.json(
          {
            error: "Invalid API key format or key is invalid",
            details: errorMessage,
            errorCode: errorCode,
          },
          { status: 400 }
        );
      } else if (errorCode === 403 || errorMessage.includes("permission")) {
        return NextResponse.json(
          {
            error: "API key does not have permission to access Gemini API",
            details: errorMessage,
            errorCode: errorCode,
          },
          { status: 403 }
        );
      } else if (
        errorCode === 429 ||
        errorMessage.includes("quota") ||
        errorMessage.includes("rate limit")
      ) {
        return NextResponse.json(
          {
            error: "API quota exceeded or rate limited",
            details: errorMessage,
            errorCode: errorCode,
          },
          { status: 429 }
        );
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        return NextResponse.json(
          {
            error: "Network error: Unable to connect to Gemini API",
            details: errorMessage,
          },
          { status: 503 }
        );
      } else {
        return NextResponse.json(
          {
            error: `API test failed: ${errorMessage}`,
            details: errorMessage,
            errorCode: errorCode,
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error("Unexpected error testing key:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
