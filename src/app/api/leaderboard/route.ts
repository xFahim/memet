import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // 1️⃣ Overall stats across all folders
    const { data: overall, error: oErr } = await supabaseAdmin.rpc(
      "get_overall_progress"
    );

    if (oErr) {
      console.error("Error fetching overall progress:", oErr);
      throw oErr;
    }

    // 2️⃣ Individual performance (annotator-wise)
    const { data: individuals, error: iErr } = await supabaseAdmin.rpc(
      "get_individual_progress"
    );

    if (iErr) {
      console.error("Error fetching individual progress:", iErr);
      throw iErr;
    }

    return NextResponse.json({
      overall: overall?.[0] || {},
      individuals: individuals || [],
    });
  } catch (err: any) {
    console.error("Leaderboard API error:", err);
    return NextResponse.json(
      { error: err.message || err.toString() },
      { status: 500 }
    );
  }
}
