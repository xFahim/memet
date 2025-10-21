import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

export async function GET() {
  try {
    const { data: keys, error } = await supabaseAdmin
      .from("geminikeys")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching Gemini keys:", error);
      return NextResponse.json(
        { error: "Failed to fetch API keys" },
        { status: 500 }
      );
    }

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("Unexpected error fetching keys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, key } = body;

    if (!name || !key) {
      return NextResponse.json(
        { error: "Name and key are required" },
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

    // Check if name already exists
    const { data: existingKey } = await supabaseAdmin
      .from("geminikeys")
      .select("id")
      .eq("name", name)
      .single();

    if (existingKey) {
      return NextResponse.json(
        { error: "A key with this name already exists" },
        { status: 409 }
      );
    }

    const { data: newKey, error } = await (supabaseAdmin as any)
      .from("geminikeys")
      .insert({
        name: name.trim(),
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
    const { id, name, key } = body;

    if (!id || !name || !key) {
      return NextResponse.json(
        { error: "ID, name and key are required" },
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

    // Check if name already exists (excluding current key)
    const { data: existingKey } = await supabaseAdmin
      .from("geminikeys")
      .select("id")
      .eq("name", name)
      .neq("id", id)
      .single();

    if (existingKey) {
      return NextResponse.json(
        { error: "A key with this name already exists" },
        { status: 409 }
      );
    }

    const { data: updatedKey, error } = await (supabaseAdmin as any)
      .from("geminikeys")
      .update({
        name: name.trim(),
        key: key.trim(),
      })
      .eq("id", id)
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
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Key ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("geminikeys")
      .delete()
      .eq("id", id);

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
