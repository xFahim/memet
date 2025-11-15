import { NextRequest, NextResponse } from "next/server";
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

    // 2️⃣ Get folder id and bucket (case-insensitive)
    const { data: folder, error: folderErr } = await supabase
      .from("folders")
      .select("id, bucket")
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

    // 3️⃣ Fetch all annotations for that user + folder with image paths
    const { data: annotations, error: fetchErr } = await supabase
      .from("annotations")
      .select("id, image_id, image_path, annotation_status, updated_at")
      .eq("assigned_to", annotator.id)
      .eq("folder_id", folder.id)
      .order("image_path", { ascending: true });

    if (fetchErr) throw fetchErr;

    // 4️⃣ Construct full image URLs using the same pattern as other endpoints
    const bucket = folder.bucket || "raw-memes";
    const annotationsWithUrls =
      annotations?.map((annotation: any) => {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(annotation.image_path);

        return {
          id: annotation.id,
          image_id: annotation.image_id,
          image_path: annotation.image_path,
          full_image_url: urlData?.publicUrl || null,
          annotation_status: annotation.annotation_status,
          updated_at: annotation.updated_at,
        };
      }) || [];

    // 5️⃣ Generate CSV content
    const csvHeaders = [
      "ID",
      "Image ID",
      "Image Path",
      "Full Image URL",
      "Status",
      "Updated At",
    ];

    const csvRows = annotationsWithUrls.map((item) => [
      item.id,
      item.image_id || "",
      item.image_path || "",
      item.full_image_url || "",
      item.annotation_status || "",
      item.updated_at || "",
    ]);

    // 6️⃣ Create CSV content
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) =>
        row
          .map((field) =>
            // Escape fields that contain commas or quotes
            typeof field === "string" &&
            (field.includes(",") || field.includes('"') || field.includes("\n"))
              ? `"${field.replace(/"/g, '""')}"`
              : field
          )
          .join(",")
      ),
    ].join("\n");

    // 7️⃣ Return CSV as downloadable file
    const filename = `image-urls-${annotator_name}-${folder_name}-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Export CSV Error:", err);
    return NextResponse.json(
      { error: err.message || err.toString() },
      { status: 500 }
    );
  }
}

