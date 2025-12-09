import { NextRequest, NextResponse } from "next/server";
import { createAIFillupService } from "@/lib/ai-fillup";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, context, for_user } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    if (!context) {
      return NextResponse.json(
        { error: "Context is required" },
        { status: 400 }
      );
    }

    if (!for_user) {
      return NextResponse.json(
        { error: "User name is required" },
        { status: 400 }
      );
    }

    // Fetch the API key from Supabase for this specific user
    console.log(`[AI-FILLUP] Fetching key for user: ${for_user}`);
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("geminikeys")
      .select("key")
      .eq("for_user", for_user)
      .single();

    if (keyError || !keyData) {
      console.error(
        `[AI-FILLUP] Key fetch error for user ${for_user}:`,
        keyError
      );
      return NextResponse.json(
        {
          error:
            "No API key configured for this user. Please set up your Gemini API key in the API Setup tab first.",
          code: "NO_API_KEY",
        },
        { status: 404 }
      );
    }

    // Type assertion to help TypeScript understand the structure
    const keyDataTyped = keyData as { key: string };
    const apiKey = keyDataTyped.key;
    if (!apiKey) {
      console.error(`[AI-FILLUP] No key value found for user ${for_user}`);
      return NextResponse.json(
        {
          error:
            "No API key configured for this user. Please set up your Gemini API key in the API Setup tab first.",
          code: "NO_API_KEY",
        },
        { status: 404 }
      );
    }

    console.log(`[AI-FILLUP] Using API key for user: ${for_user}`);

    // Create AI service with the user's API key from database
    const aiService = createAIFillupService(apiKey);

    // Generate AI fillup data
    const result = await aiService.generateFillupData(imageUrl, context);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      rawResponse: result.rawResponse,
      error: result.error, // Include parsing error if any
    });
  } catch (error: any) {
    console.error("AI Fillup API Error:", error);
    return NextResponse.json(
      { error: error.message || "AI fillup failed" },
      { status: 500 }
    );
  }
}
