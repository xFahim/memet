import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const annotationId = searchParams.get("id");
  const annotatorName = searchParams.get("annotator");
  const folderName = searchParams.get("folder");

  if (!annotationId || !annotatorName || !folderName) {
    return NextResponse.json(
      { error: "Missing annotation ID, annotator, or folder" },
      { status: 400 }
    );
  }

  try {
    // Get annotator ID
    const { data: annotatorRow, error: aErr } = await supabase
      .from("annotators")
      .select("id")
      .ilike("name", annotatorName)
      .limit(1)
      .single();

    if (aErr || !annotatorRow) {
      return NextResponse.json(
        { error: "Annotator not found" },
        { status: 404 }
      );
    }

    // Get folder ID
    const { data: folderRow, error: fErr } = await supabase
      .from("folders")
      .select("id, bucket")
      .ilike("name", folderName)
      .limit(1)
      .single();

    if (fErr || !folderRow) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Get the specific annotation
    const { data: annotation, error: annErr } = await supabase
      .from("annotations")
      .select("*")
      .eq("id", annotationId)
      .eq("assigned_to", annotatorRow.id)
      .eq("folder_id", folderRow.id)
      .single();

    if (annErr || !annotation) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    // Get the image URL
    const bucket = folderRow.bucket || "Raw Memes";
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(annotation.image_path);

    return NextResponse.json({
      annotation,
      image_url: urlData?.publicUrl || null,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || err.toString() },
      { status: 500 }
    );
  }
}
