import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const bucket = "Raw Memes";
    const folder = "Bangla Political";
    const folder_id = "e9e8ce25-4fb0-4e15-b193-c6d717ab9b18"; // your folder id

    // list files (handle up to 1000; if >1000 we will need pagination)
    const { data: files, error: listErr } = await supabaseAdmin.storage
      .from(bucket)
      .list(folder, { limit: 1000 });

    if (listErr) throw listErr;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: "No files found in folder", count: 0 },
        { status: 200 }
      );
    }

    // prepare rows
    const rows = files.map((f) => ({
      image_id: f.name,
      image_path: `${folder}/${f.name}`,
      folder_id,
      assigned_to: "", // Will be assigned later
      annotation_status: "pending" as const,
      image_description: null,
      entity: null,
      role: null,
      role_explanation: null,
      humor_explanation: null,
      context: null,
      domain: null,
      ocr_text: null,
      in_progress_at: null,
      completed_at: null,
    }));

    // insert rows (using insert instead of upsert to avoid type issues)
    const { data: inserted, error: insertErr } = await (
      supabaseAdmin.from("annotations") as any
    ).insert(rows);

    if (insertErr) throw insertErr;

    return NextResponse.json({
      message: "Insert complete",
      inserted: inserted?.length || 0,
      sample: inserted?.slice(0, 5) || [],
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || err.toString() },
      { status: 500 }
    );
  }
}
