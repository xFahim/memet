import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const annotator = searchParams.get("annotator");
  const folder = searchParams.get("folder");
  const status = searchParams.get("status");

  if (!annotator || !folder) {
    return NextResponse.json(
      { error: "Missing annotator or folder" },
      { status: 400 }
    );
  }

  try {
    console.log("Looking for annotator:", annotator, "folder:", folder);

    // 1️⃣ get IDs
    const { data: annotatorRow, error: aErr } = await supabase
      .from("annotators")
      .select("id")
      .ilike("name", annotator)
      .limit(1)
      .single();

    if (aErr || !annotatorRow) {
      console.error("Annotator lookup error:", aErr, "Looking for:", annotator);
      return NextResponse.json(
        { error: "Annotator not found" },
        { status: 404 }
      );
    }

    const { data: folderRow, error: fErr } = await supabase
      .from("folders")
      .select("id, bucket")
      .ilike("name", folder)
      .limit(1)
      .single();

    if (fErr || !folderRow) {
      console.error("Folder lookup error:", fErr, "Looking for:", folder);
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const annotator_id = annotatorRow.id;
    const folder_id = folderRow.id;

    // 2️⃣ fetch stats counts
    const { data: statusCounts, error: sErr } = await supabase.rpc(
      "get_status_counts",
      {
        p_annotator: annotator_id,
        p_folder: folder_id,
      }
    );
    if (sErr) throw sErr;

    // 3️⃣ fetch list of memes for this annotator & folder
    let query = supabase
      .from("annotations")
      .select("id,image_id,image_path,annotation_status,updated_at")
      .eq("assigned_to", annotator_id)
      .eq("folder_id", folder_id)
      .order("image_path", { ascending: true });

    if (status) query = query.eq("annotation_status", status);

    const { data: memes, error: mErr } = await query;
    if (mErr) throw mErr;

    // 4️⃣ construct image URLs using the same pattern as next-annotation
    const bucket = folderRow.bucket || "raw-memes"; // Get bucket from folder data
    const memesWithUrls =
      memes?.map((meme: any) => {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(meme.image_path);

        return {
          ...meme,
          image_url: urlData?.publicUrl || null,
        };
      }) || [];

    return NextResponse.json({ stats: statusCounts[0], memes: memesWithUrls });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || err.toString() },
      { status: 500 }
    );
  }
}
