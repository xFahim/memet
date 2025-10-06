import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { annotator_name, folder_name } = await request.json();

    if (!annotator_name) {
      return NextResponse.json(
        { error: "Missing annotator_name" },
        { status: 400 }
      );
    }

    console.log(`Searching for annotator: "${annotator_name}"`);

    // 1️⃣ find annotator id (case-insensitive)
    const { data: annotator, error: userErr } = await supabase
      .from("annotators")
      .select("id, name")
      .ilike("name", annotator_name)
      .single();

    if (userErr || !annotator) {
      console.error("Annotator search error:", userErr);

      // Let's see what annotators exist
      const { data: allAnnotators } = await supabase
        .from("annotators")
        .select("id, name");

      console.log("Available annotators:", allAnnotators);

      return NextResponse.json(
        {
          error: `Annotator "${annotator_name}" not found`,
          availableAnnotators: allAnnotators?.map((a) => a.name) || [],
        },
        { status: 404 }
      );
    }

    console.log(
      `Found annotator: "${annotator.name}" with ID: ${annotator.id}`
    );

    // 2️⃣ optionally, filter by folder if provided
    let query = supabase
      .from("annotations")
      .update({
        annotation_status: "pending",
        ocr_text: null,
        image_description: null,
        entity: null,
        role: null,
        role_explanation: null,
        humor_explanation: null,
        context: null,
        domain: null,
        updated_at: new Date().toISOString(),
      })
      .eq("assigned_to", annotator.id);

    if (folder_name) {
      // get folder id
      const { data: folder, error: folderErr } = await supabase
        .from("folders")
        .select("id")
        .eq("name", folder_name)
        .single();

      if (folderErr || !folder) {
        throw new Error("Folder not found");
      }
      query = query.eq("folder_id", folder.id);
    }

    const { error: clearErr } = await query;
    if (clearErr) {
      throw clearErr;
    }

    // 3️⃣ Set the first meme (by serial order) to "in_progress" so user can start working
    const { data: firstMeme, error: firstMemeErr } = await supabase
      .from("annotations")
      .select("id, image_path")
      .eq("assigned_to", annotator.id)
      .eq("annotation_status", "pending")
      .order("image_path", { ascending: true }) // Order by image_path (same as status table)
      .limit(1)
      .single();

    if (firstMeme && !firstMemeErr) {
      const { error: updateErr } = await supabase
        .from("annotations")
        .update({
          annotation_status: "in_progress",
          in_progress_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", firstMeme.id);

      if (updateErr) {
        console.error("Error setting first meme to in_progress:", updateErr);
      } else {
        console.log(
          `Set meme ${firstMeme.id} (${firstMeme.image_path}) to in_progress status`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Annotations reset successfully. First meme set to in_progress.",
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
