import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forUser = searchParams.get("for_user");

    if (!forUser) {
      return NextResponse.json(
        { error: "for_user parameter is required" },
        { status: 400 }
      );
    }

    // Get the key metadata for the specific user (DO NOT return the actual key value)
    const { data: key, error } = await supabaseAdmin
      .from("geminikeys")
      .select("id, name, for_user, created_at")
      .eq("for_user", forUser)
      .single();

    if (error) {
      // If no key found, return null instead of error
      if (error.code === "PGRST116") {
        return NextResponse.json({ key: null });
      }
      console.error("Error fetching Gemini key:", error);
      return NextResponse.json(
        { error: "Failed to fetch API key" },
        { status: 500 }
      );
    }

    // Return only metadata, never the actual key value
    return NextResponse.json({ key });
  } catch (error) {
    console.error("Unexpected error fetching key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, key, for_user } = body;

    if (!name || !key || !for_user) {
      return NextResponse.json(
        { error: "Name, key, and for_user are required" },
        { status: 400 }
      );
    }

    // Validate key format (basic validation)
    if (!key.startsWith("AIza") || key.length < 30) {
      return NextResponse.json(
        {
          error:
            "Invalid API key format. Gemini keys should start with 'AIza' and be at least 30 characters long.",
        },
        { status: 400 }
      );
    }

    // Check if a key already exists for this user
    const { data: existingKey } = await supabaseAdmin
      .from("geminikeys")
      .select("id")
      .eq("for_user", for_user)
      .single();

    if (existingKey) {
      // Update existing key instead of creating new one
      const { data: updatedKey, error: updateError } = await (supabaseAdmin as any)
        .from("geminikeys")
        .update({
          name: name.trim(),
          key: key.trim(),
        })
        .eq("for_user", for_user)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating Gemini key:", updateError);
        return NextResponse.json(
          { error: "Failed to update API key" },
          { status: 500 }
        );
      }

      return NextResponse.json({ key: updatedKey });
    }

    // Create new key for user
    const { data: newKey, error } = await (supabaseAdmin as any)
      .from("geminikeys")
      .insert({
        name: name.trim(),
        for_user: for_user.trim(),
        key: key.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating Gemini key:", error);
      return NextResponse.json(
        { error: "Failed to create API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({ key: newKey }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error creating key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { for_user, name, key } = body;

    if (!for_user || !name || !key) {
      return NextResponse.json(
        { error: "for_user, name and key are required" },
        { status: 400 }
      );
    }

    // Validate key format (basic validation)
    if (!key.startsWith("AIza") || key.length < 30) {
      return NextResponse.json(
        {
          error:
            "Invalid API key format. Gemini keys should start with 'AIza' and be at least 30 characters long.",
        },
        { status: 400 }
      );
    }

    // Update the key for the user
    const { data: updatedKey, error } = await (supabaseAdmin as any)
      .from("geminikeys")
      .update({
        name: name.trim(),
        key: key.trim(),
      })
      .eq("for_user", for_user)
      .select()
      .single();

    if (error) {
      console.error("Error updating Gemini key:", error);
      return NextResponse.json(
        { error: "Failed to update API key" },
        { status: 500 }
      );
    }

    if (!updatedKey) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    return NextResponse.json({ key: updatedKey });
  } catch (error) {
    console.error("Unexpected error updating key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { for_user } = body;

    if (!for_user) {
      return NextResponse.json(
        { error: "for_user is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("geminikeys")
      .delete()
      .eq("for_user", for_user);

    if (error) {
      console.error("Error deleting Gemini key:", error);
      return NextResponse.json(
        { error: "Failed to delete API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Key deleted successfully" });
  } catch (error) {
    console.error("Unexpected error deleting key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
