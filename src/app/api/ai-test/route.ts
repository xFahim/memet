import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, imageUrl, freeFormText } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    // Use custom prompt if provided, otherwise use simple test
    const content =
      prompt && prompt.trim() !== "simple test"
        ? prompt
        : "Hi, are you there? Please respond with a simple greeting.";

    let response;

    // If imageUrl is provided, use vision model with image
    if (imageUrl) {
      // Fetch the image data
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();

      // Compress image to reduce API load (max 1MB for free tier)
      const maxSizeBytes = 1024 * 1024; // 1MB
      let imageBase64;

      if (imageBuffer.byteLength > maxSizeBytes) {
        // If image is too large, we'll need to compress it
        // For now, we'll use the original but add a warning
        console.log(
          `Image size: ${imageBuffer.byteLength} bytes (may cause API overload)`
        );
        imageBase64 = Buffer.from(imageBuffer).toString("base64");
      } else {
        imageBase64 = Buffer.from(imageBuffer).toString("base64");
      }

      // Determine image type from URL or response headers
      const contentType =
        imageResponse.headers.get("content-type") || "image/jpeg";
      const mimeType = contentType.split(";")[0];

      // Retry logic for vision API calls (more prone to overload)
      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 2000; // 2 seconds

      while (retryCount < maxRetries) {
        try {
          // Call Gemini API with image
          response = await ai.models.generateContent({
            model: "gemini-2.0-flash-lite", // Use vision-capable model for free tier
            contents: [
              {
                role: "user",
                parts: [
                  { text: content },
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
          break; // Success, exit retry loop
        } catch (retryError: any) {
          retryCount++;

          // Check if it's a 503 overloaded error
          if (
            retryError.code === 503 ||
            retryError.message?.includes("overloaded")
          ) {
            if (retryCount < maxRetries) {
              console.log(
                `Vision API overloaded, retrying in ${retryDelay}ms... (attempt ${retryCount}/${maxRetries})`
              );
              await new Promise((resolve) =>
                setTimeout(resolve, retryDelay * retryCount)
              );
              continue;
            } else {
              // After max retries, throw a more helpful error
              throw new Error(
                "Vision API is currently overloaded. Please try again in a few minutes, or use text-only mode."
              );
            }
          } else {
            // If it's not a 503 error, throw immediately
            throw retryError;
          }
        }
      }
    } else {
      // Call Gemini API with text only
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: content,
      });
    }

    return NextResponse.json({
      response: response?.text || "No response generated",
      success: true,
    });
  } catch (error: any) {
    console.error("AI Test API Error:", error);

    // Handle specific Gemini API errors
    if (error.code === 503 || error.message?.includes("overloaded")) {
      return NextResponse.json(
        {
          error:
            "Vision API is currently overloaded. This is common with free tier. Try again in a few minutes or use text-only mode.",
          code: "MODEL_OVERLOADED",
          fallback: true,
          suggestion:
            "Consider using text-only mode for more reliable results on free tier.",
        },
        { status: 503 }
      );
    }

    if (error.code === 429 || error.message?.includes("quota")) {
      return NextResponse.json(
        {
          error: "API quota exceeded. Please check your API key limits.",
          code: "QUOTA_EXCEEDED",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || "AI test failed" },
      { status: 500 }
    );
  }
}
