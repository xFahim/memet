import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const annotatorName = searchParams.get("annotator") || "";
  const folderName = searchParams.get("folder") || "";

  if (!annotatorName || !folderName) {
    return NextResponse.json(
      { error: "Missing annotator or folder" },
      { status: 400 }
    );
  }

  try {
    // 1) annotator id
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

    // 2) folder id + bucket
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

    // 3) resume existing in-progress
    const { data: inProg, error: ipErr } = await supabase
      .from("annotations")
      .select("*")
      .eq("assigned_to", annotatorId)
      .eq("folder_id", folderId)
      .eq("annotation_status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(1);
    if (ipErr) throw ipErr;
    if (inProg && inProg.length > 0) {
      const item = inProg[0];
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(item.image_path);
      return NextResponse.json({
        annotation: item,
        image_url: urlData?.publicUrl || null,
      });
    }

    // 4) pick one pending
    const { data: pending, error: pErr } = await supabase
      .from("annotations")
      .select("*")
      .eq("assigned_to", annotatorId)
      .eq("folder_id", folderId)
      .eq("annotation_status", "pending")
      .order("image_path", { ascending: true })
      .limit(1);
    if (pErr) throw pErr;
    if (!pending || pending.length === 0) {
      return NextResponse.json({
        annotation: null,
        message: "No more items",
      });
    }

    const pick = pending[0];

    // 5) claim it atomically (only if still pending)
    const { data: updated, error: uErr } = await supabase
      .from("annotations")
      .update({
        annotation_status: "in_progress",
        in_progress_at: new Date().toISOString(),
      })
      .match({
        id: pick.id,
        assigned_to: annotatorId,
        annotation_status: "pending",
      })
      .select()
      .limit(1)
      .single();

    if (uErr || !updated) {
      // race / someone else claimed it — ask client to retry
      return NextResponse.json(
        {
          error: "Could not lock item, please retry",
        },
        { status: 409 }
      );
    }

    const { data: urlData2 } = supabase.storage
      .from(bucket)
      .getPublicUrl(updated.image_path);
    return NextResponse.json({
      annotation: updated,
      image_url: urlData2?.publicUrl || null,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      {
        error: err.message || String(err),
      },
      { status: 500 }
    );
  }
}

