import { NextRequest, NextResponse } from "next/server";
import { createAIFillupService } from "@/lib/ai-fillup";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, context, apiKey } = body;

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

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Create AI service with the provided API key
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
