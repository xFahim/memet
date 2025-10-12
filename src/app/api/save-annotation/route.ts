import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      annotatorName,
      annotationId,
      ocr_text,
      image_description,
      entity,
      role,
      role_explanation,
      entity_2,
      role_2,
      role_explanation_2,
      humor_explanation,
      context,
      domain,
    } = body;

    if (!annotationId || !annotatorName) {
      return NextResponse.json(
        { error: "annotationId and annotatorName required" },
        { status: 400 }
      );
    }

    // get annotator id
    const { data: ann, error: aErr } = await supabase
      .from("annotators")
      .select("id")
      .ilike("name", annotatorName)
      .single();

    if (aErr || !ann) {
      return NextResponse.json(
        { error: "Annotator not found" },
        { status: 404 }
      );
    }
    const annotatorId = ann.id;

    // verify ownership and get current status
    const { data: current, error: rErr } = await supabase
      .from("annotations")
      .select("assigned_to, annotation_status")
      .eq("id", annotationId)
      .single();

    if (rErr) throw rErr;
    if (current.assigned_to !== annotatorId) {
      return NextResponse.json(
        { error: "This image is not assigned to you" },
        { status: 403 }
      );
    }

    // Check if this was the current in-progress annotation
    const wasInProgress = current.annotation_status === "in_progress";

    // update fields + mark completed
    const { data: updated, error: updErr } = await supabase
      .from("annotations")
      .update({
        ocr_text,
        image_description,
        entity,
        role: role || null,
        role_explanation,
        entity_2,
        role_2: role_2 || null,
        role_explanation_2,
        humor_explanation,
        context,
        domain,
        annotation_status: "completed",
        in_progress_at: null,
      })
      .eq("id", annotationId)
      .select()
      .single();

    if (updErr) throw updErr;

    // Return whether the cursor should move (only if it was in_progress)
    return NextResponse.json({
      updated,
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
