import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export async function POST(req: NextRequest) {
  const sourceBucket = "Raw Memes"; // current bucket with space
  const targetBucket = "raw-memes"; // new clean bucket

  try {
    // 1️⃣ list folders in source bucket
    const { data: folders, error: listErr } = await supabase.storage
      .from(sourceBucket)
      .list("", { limit: 1000 });
    if (listErr) throw listErr;
    if (!folders || folders.length === 0)
      return NextResponse.json({
        message: "No folders found in source bucket",
      });

    let totalCopied = 0;
    const results: string[] = [];

    // 2️⃣ iterate through folders
    for (const folder of folders) {
      if (!folder.name) continue;
      // list all files in this folder
      const { data: files, error: fileErr } = await supabase.storage
        .from(sourceBucket)
        .list(folder.name, { limit: 1000 });
      if (fileErr) throw fileErr;
      if (!files) continue;

      for (const file of files) {
        const fromPath = `${folder.name}/${file.name}`;
        const toPath = `${folder.name}/${file.name}`;

        // Download file from old bucket
        const { data: fileData, error: downloadErr } = await supabase.storage
          .from(sourceBucket)
          .download(fromPath);
        if (downloadErr) {
          console.error(`❌ Failed: ${fromPath}`, downloadErr.message);
          continue;
        }

        // Upload to new bucket
        const { error: uploadErr } = await supabase.storage
          .from(targetBucket)
          .upload(toPath, fileData, { upsert: true });
        if (uploadErr) {
          console.error(`⚠️ Upload error: ${fromPath}`, uploadErr.message);
          continue;
        }

        results.push(toPath);
        totalCopied++;
      }
    }

    // 3️⃣ update folder record in DB (optional)
    await supabase
      .from("folders")
      .update({ bucket: targetBucket })
      .eq("bucket", sourceBucket);

    return NextResponse.json({
      message: "Migration complete",
      totalCopied,
      sample: results.slice(0, 5),
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}

