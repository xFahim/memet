import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const annotator_name = searchParams.get("annotator");
  const folder_name = searchParams.get("folder");

  if (!annotator_name || !folder_name) {
    return NextResponse.json(
      { error: "Missing annotator or folder" },
      { status: 400 }
    );
  }

  try {
    // 1️⃣ Get annotator id (case-insensitive)
    const { data: annotator, error: annotatorErr } = await supabase
      .from("annotators")
      .select("id")
      .ilike("name", annotator_name)
      .single();

    if (annotatorErr || !annotator) {
      console.error(
        "Annotator lookup error:",
        annotatorErr,
        "Looking for:",
        annotator_name
      );
      throw new Error("Annotator not found");
    }

    // 2️⃣ Get folder id (case-insensitive)
    const { data: folder, error: folderErr } = await supabase
      .from("folders")
      .select("id")
      .ilike("name", folder_name)
      .single();

    if (folderErr || !folder) {
      console.error(
        "Folder lookup error:",
        folderErr,
        "Looking for:",
        folder_name
      );
      throw new Error("Folder not found");
    }

    // 3️⃣ Fetch completed annotations for that user + folder
    const { data: annotations, error: fetchErr } = await supabase
      .from("annotations")
      .select(
        "image_id, image_path, folder_id, assigned_to, ocr_text, entity, role, role_explanation, humor_explanation, context, domain, image_description"
      )
      .eq("assigned_to", annotator.id)
      .eq("folder_id", folder.id)
      .eq("annotation_status", "completed");

    if (fetchErr) throw fetchErr;

    // 4️⃣ Convert to CSV format
    if (!annotations || annotations.length === 0) {
      return new NextResponse("No completed annotations found", {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${annotator_name}_${folder_name}_annotations.csv"`,
        },
      });
    }

    // Define CSV headers
    const headers = [
      "Image ID",
      "Image Path",
      "OCR Text",
      "Entity",
      "Role",
      "Role Explanation",
      "Humor Explanation",
      "Context",
      "Domain",
      "Image Description",
    ];

    // Convert data to CSV rows
    const csvRows = annotations.map((annotation) => [
      annotation.image_id || "",
      annotation.image_path || "",
      `"${(annotation.ocr_text || "").replace(/"/g, '""')}"`, // Escape quotes in OCR text
      annotation.entity || "",
      annotation.role || "",
      `"${(annotation.role_explanation || "").replace(/"/g, '""')}"`, // Escape quotes
      `"${(annotation.humor_explanation || "").replace(/"/g, '""')}"`, // Escape quotes
      `"${(annotation.context || "").replace(/"/g, '""')}"`, // Escape quotes
      annotation.domain || "",
      `"${(annotation.image_description || "").replace(/"/g, '""')}"`, // Escape quotes
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    // 5️⃣ Return as downloadable CSV
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${annotator_name}_${folder_name}_annotations.csv"`,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
