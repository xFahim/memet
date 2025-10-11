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
        "image_id, image_path, folder_id, assigned_to, ocr_text, entity, role, role_explanation, entity_2, role_2, role_explanation_2, humor_explanation, context, domain, image_description"
      )
      .eq("assigned_to", annotator.id)
      .eq("folder_id", folder.id)
      .eq("annotation_status", "completed");

    if (fetchErr) throw fetchErr;

    // 4️⃣ Return as downloadable JSON
    return new NextResponse(JSON.stringify(annotations, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${annotator_name}_${folder_name}_annotations.json"`,
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
