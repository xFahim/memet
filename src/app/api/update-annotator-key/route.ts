import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// This endpoint is deprecated - keys are now managed directly via gemini-keys API with for_user
// Keeping for backward compatibility but redirecting to gemini-keys API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const annotatorName = searchParams.get("annotator");

    if (!annotatorName) {
      return NextResponse.json(
        { error: "Annotator name is required" },
        { status: 400 }
      );
    }

    // Get the key for this user directly from geminikeys table
    const { data: key, error: keyError } = await supabaseAdmin
      .from("geminikeys")
      .select("id")
      .eq("for_user", annotatorName)
      .single();

    if (keyError || !key) {
      return NextResponse.json({
        gemini_key_id: null,
      });
    }

    // Type assertion to help TypeScript understand the structure
    const keyTyped = key as { id: string };

    return NextResponse.json({
      gemini_key_id: keyTyped.id,
    });
  } catch (error) {
    console.error("Unexpected error fetching annotator key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// This endpoint is deprecated - use gemini-keys API instead
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Use /api/gemini-keys with for_user parameter instead.",
      message: "Keys are now managed directly via the gemini-keys API"
    },
    { status: 410 }
  );
}
