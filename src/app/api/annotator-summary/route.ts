import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Missing annotator name" },
        { status: 400 }
      );
    }

    // Capitalize first letter of name for database lookup
    const capitalizedName =
      name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    console.log("API: Looking for annotator with name:", capitalizedName);

    // 1️⃣ Fetch annotator record + progress summary
    const { data: annotator, error: aErr } = await supabaseAdmin
      .from("annotator_summary")
      .select("*")
      .ilike("name", capitalizedName)
      .single();

    console.log("API: Annotator query result:", { annotator, error: aErr });

    if (aErr) throw aErr;

    // Type assertion to help TypeScript understand the structure
    const annotatorData = annotator as {
      id: string;
      name: string;
      total_memes_assigned: number;
      completed_annotations: number;
      folders_assigned: string[];
      created_at: string;
      updated_at: string;
    };

    // 2️⃣ Find folders that this annotator has assignments in
    console.log("API: Looking for folders:", annotatorData.folders_assigned);

    const { data: folders, error: fErr } = await supabaseAdmin
      .from("folder_stats")
      .select("*")
      .in("name", annotatorData.folders_assigned);

    console.log("API: Folders query result:", { folders, error: fErr });

    if (fErr) throw fErr;

    const response = {
      annotator: {
        id: annotatorData.id,
        name: annotatorData.name,
        total_memes_assigned: annotatorData.total_memes_assigned,
        completed_annotations: annotatorData.completed_annotations,
        folders_assigned: annotatorData.folders_assigned,
      },
      folders,
    };

    console.log("API: Final response:", response);

    return NextResponse.json(response);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || err.toString() },
      { status: 500 }
    );
  }
}
