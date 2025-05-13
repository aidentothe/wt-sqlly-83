import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(req: NextRequest) {
  const { fileId } = await req.json();
  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  // Delete file data and metadata
  const { error: dataError } = await supabase.from("csv_data").delete().eq("file_id", fileId);
  const { error: fileError } = await supabase.from("csv_files").delete().eq("id", fileId);

  if (dataError || fileError) {
    return NextResponse.json({ error: dataError?.message || fileError?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 