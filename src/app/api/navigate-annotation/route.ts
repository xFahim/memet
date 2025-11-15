import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const annotationId = searchParams.get("annotationId");
  const annotatorName = searchParams.get("annotator");
  const folderName = searchParams.get("folder");
  const direction = searchParams.get("direction"); // "prev" or "next"

  if (!annotationId || !annotatorName || !folderName || !direction) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  if (direction !== "prev" && direction !== "next") {
    return NextResponse.json(
      { error: "Direction must be 'prev' or 'next'" },
      { status: 400 }
    );
  }

  try {
    // Get annotator ID
    const { data: ann, error: aErr } = await supabase
      .from("annotators")
      .select("id")
      .ilike("name", annotatorName)
      .limit(1)
      .single();

    if (aErr || !ann) {
      return NextResponse.json(
        { error: "Annotator not found" },
        { status: 404 }
      );
    }
    const annotatorId = ann.id;

    // Get folder ID and bucket
    const { data: folder, error: fErr } = await supabase
      .from("folders")
      .select("id, bucket")
      .ilike("name", folderName)
      .limit(1)
      .single();

    if (fErr || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
    const folderId = folder.id;
    const bucket = folder.bucket || "Raw Memes";

    // Get current annotation to get its image_path for ordering
    const { data: current, error: currErr } = await supabase
      .from("annotations")
      .select("image_path")
      .eq("id", annotationId)
      .eq("assigned_to", annotatorId)
      .eq("folder_id", folderId)
      .single();

    if (currErr || !current) {
      return NextResponse.json(
        { error: "Current annotation not found" },
        { status: 404 }
      );
    }

    // Query for previous or next annotation
    let query = supabase
      .from("annotations")
      .select("*")
      .eq("assigned_to", annotatorId)
      .eq("folder_id", folderId);

    if (direction === "prev") {
      // Get annotation with image_path < current, ordered descending to get the closest one
      query = query
        .lt("image_path", current.image_path)
        .order("image_path", { ascending: false })
        .limit(1);
    } else {
      // Get annotation with image_path > current, ordered ascending to get the closest one
      query = query
        .gt("image_path", current.image_path)
        .order("image_path", { ascending: true })
        .limit(1);
    }

    const { data: annotations, error: navErr } = await query;

    if (navErr) throw navErr;

    if (!annotations || annotations.length === 0) {
      return NextResponse.json({
        annotation: null,
        message: direction === "prev" ? "No previous annotation" : "No next annotation",
      });
    }

    const targetAnnotation = annotations[0];

    // Get the image URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(targetAnnotation.image_path);

    return NextResponse.json({
      annotation: targetAnnotation,
      image_url: urlData?.publicUrl || null,
    });
  } catch (err: any) {
    console.error("Navigation Error:", err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}

