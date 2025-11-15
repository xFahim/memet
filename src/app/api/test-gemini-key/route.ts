import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyId, for_user } = body;

    // Support both keyId (for backward compatibility) and for_user
    let keyData;
    if (for_user) {
      // Get the key by user
      const { data, error: fetchError } = await (supabaseAdmin as any)
        .from("geminikeys")
        .select("id, name, key")
        .eq("for_user", for_user)
        .single();

      if (fetchError || !data) {
        return NextResponse.json({ error: "API key not found for this user" }, { status: 404 });
      }
      keyData = data;
    } else if (keyId) {
      // Get the key by ID (backward compatibility)
      const { data, error: fetchError } = await (supabaseAdmin as any)
        .from("geminikeys")
        .select("id, name, key")
        .eq("id", keyId)
        .single();

      if (fetchError || !data) {
        return NextResponse.json({ error: "API key not found" }, { status: 404 });
      }
      keyData = data;
    } else {
      return NextResponse.json(
        { error: "Either keyId or for_user is required" },
        { status: 400 }
      );
    }

    // Test the key with a simple API call
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${keyData.key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Hi, are you there? Please respond with just 'Yes, I am working!'",
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 50,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.error) {
          const errorCode = data.error.code;
          const errorMessage = data.error.message;

          if (errorCode === 400 && errorMessage.includes("API_KEY_INVALID")) {
            return NextResponse.json(
              { error: "Invalid API key format" },
              { status: 400 }
            );
          } else if (errorCode === 403) {
            return NextResponse.json(
              {
                error: "API key does not have permission to access Gemini API",
              },
              { status: 403 }
            );
          } else if (errorCode === 429) {
            return NextResponse.json(
              { error: "API quota exceeded or rate limited" },
              { status: 429 }
            );
          } else {
            return NextResponse.json(
              { error: `API Error: ${errorMessage}` },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { error: `HTTP Error: ${response.status}` },
            { status: response.status }
          );
        }
      }

      // Check if we got a valid response
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const responseText = data.candidates[0].content.parts[0].text;
        return NextResponse.json({
          message: `✅ API key is working! Response: "${responseText}"`,
          success: true,
          keyName: keyData.name,
          response: responseText,
        });
      } else {
        return NextResponse.json(
          { error: "Invalid response format from Gemini API" },
          { status: 400 }
        );
      }
    } catch (fetchError: any) {
      console.error("Gemini API test error:", fetchError);

      if (
        fetchError.name === "TypeError" &&
        fetchError.message.includes("fetch")
      ) {
        return NextResponse.json(
          { error: "Network error: Unable to connect to Gemini API" },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `API test failed: ${fetchError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error testing key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
