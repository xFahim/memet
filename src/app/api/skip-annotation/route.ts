import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { annotation_id } = body;

    if (!annotation_id) {
      return NextResponse.json(
        { error: "Missing annotation_id" },
        { status: 400 }
      );
    }

    // Get current status before updating
    const { data: current, error: getErr } = await supabase
      .from("annotations")
      .select("annotation_status")
      .eq("id", annotation_id)
      .single();

    if (getErr) throw getErr;

    // Check if this was the current in-progress annotation
    const wasInProgress = current.annotation_status === "in_progress";

    // Mark as skipped
    const { error: updErr } = await supabase
      .from("annotations")
      .update({
        annotation_status: "skipped",
        updated_at: new Date().toISOString(),
        in_progress_at: null,
      })
      .eq("id", annotation_id);

    if (updErr) throw updErr;

    return NextResponse.json({
      success: true,
      movedCursor: wasInProgress,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
