import { NextRequest, NextResponse } from "next/server";
import { createClient, type PostgrestError } from "@supabase/supabase-js";

function formatSupabaseError(err: PostgrestError) {
  return {
    message: err.message,
    details: err.details ?? null,
    hint: err.hint ?? null,
    code: err.code ?? null,
  } as const;
}

export async function DELETE(req: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the server" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    let body: Record<string, unknown> = {};
    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        body = await req.json();
      } catch {
        // No-op for invalid/missing JSON
      }
    }

    const url = new URL(req.url);
    const fileIdParam = body.fileId ?? url.searchParams.get("fileId");
    const deleteAllParam = body.deleteAll ?? url.searchParams.get("deleteAll");

    const fileId = typeof fileIdParam === "string" && fileIdParam !== "null" ? fileIdParam : null;
    const deleteAll = deleteAllParam === true || deleteAllParam === "true";

    console.log(`[DELETE /api/mastra/delete-csv-file] fileId=${fileId}, deleteAll=${deleteAll}`);

    if (deleteAll) {
      const { error: dataErr } = await supabase.from("csv_data").delete().neq("file_id", null);
      if (dataErr) {
        console.error("Supabase csv_data delete error:", dataErr);
        return NextResponse.json({ error: formatSupabaseError(dataErr) }, { status: 500 });
      }

      const { error: fileErr } = await supabase.from("csv_files").delete().neq("id", null);
      if (fileErr) {
        console.error("Supabase csv_files delete error:", fileErr);
        return NextResponse.json({ error: formatSupabaseError(fileErr) }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "All CSV content deleted." });
    }

    if (!fileId) {
      return NextResponse.json(
        { error: "Valid fileId is required unless deleteAll=true." },
        { status: 400 }
      );
    }

    const { error: dataErrSingle } = await supabase.from("csv_data").delete().eq("file_id", fileId);
    if (dataErrSingle) {
      console.error(`Supabase csv_data delete error for ${fileId}:`, dataErrSingle);
      return NextResponse.json({ error: formatSupabaseError(dataErrSingle) }, { status: 500 });
    }

    const { error: fileErrSingle } = await supabase.from("csv_files").delete().eq("id", fileId);
    if (fileErrSingle) {
      console.error(`Supabase csv_files delete error for ${fileId}:`, fileErrSingle);
      return NextResponse.json({ error: formatSupabaseError(fileErrSingle) }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `File ${fileId} deleted.` });
  } catch (err) {
    console.error("Unexpected error in DELETE /api/mastra/delete-csv-file:", err);
    const msg = err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
