import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Test with a simple image URL (a public image with text)
    const testImageUrl =
      "https://via.placeholder.com/300x100/000000/FFFFFF?text=Hello+World";

    console.log("Testing OCR with image:", testImageUrl);

    const formData = new URLSearchParams();
    formData.append("url", testImageUrl);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("OCREngine", "2");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: "K89194750488957",
      },
      body: formData,
    });

    console.log("OCR Test Response Status:", response.status);

    const result = await response.json();
    console.log("OCR Test Response:", JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      status: response.status,
      result: result,
      extractedText: result?.ParsedResults?.[0]?.ParsedText || "No text found",
    });
  } catch (err: any) {
    console.error("OCR Test error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
