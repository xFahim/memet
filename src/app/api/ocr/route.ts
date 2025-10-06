import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    console.log("OCR Request - Image URL:", imageUrl);

    const formData = new URLSearchParams();
    formData.append("url", imageUrl);
    formData.append("language", "eng"); // Changed to English first to test
    formData.append("isOverlayRequired", "false");
    formData.append("OCREngine", "2"); // use engine 2 (supports Bangla)

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: "K89194750488957", // Your provided API key
      },
      body: formData,
    });

    console.log("OCR API Response Status:", response.status);

    const result = await response.json();
    console.log("OCR API Response:", JSON.stringify(result, null, 2));

    // Check if the API call was successful
    if (!response.ok) {
      return NextResponse.json(
        { error: "OCR API call failed", details: result },
        { status: 500 }
      );
    }

    // Check if we have parsed results
    if (!result?.ParsedResults || result.ParsedResults.length === 0) {
      // Check if there's an error message in the response
      if (result?.ErrorMessage) {
        return NextResponse.json(
          { error: `OCR API Error: ${result.ErrorMessage}`, details: result },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "No text detected in image", details: result },
        { status: 200 } // This is not really an error, just no text found
      );
    }

    const text = result.ParsedResults[0].ParsedText || "No text detected";
    console.log("Extracted text:", text);

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("OCR error:", err);
    return NextResponse.json(
      { error: "Something went wrong", details: err.message },
      { status: 500 }
    );
  }
}
