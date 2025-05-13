import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DELETE /api/mastra/delete-csv-file
 *
 * Body *(optional)*  : { fileId?: string; deleteAll?: boolean }
 * Query params (fallback): ?fileId=…&deleteAll=true
 *
 * Uses a **service‑role** Supabase client so RLS policies won’t block deletes.
 * If the required env vars are missing the route responds with 500 + message
 * instead of crashing the whole function (avoids the blank 500 you saw).
 */
export async function DELETE(req: NextRequest) {
  /*─────────────────────────────────────────────────────────────────────────────*/
  /* 0. Build Supabase client – *inside* the handler so missing env vars don’t   */
  /*    crash the route before we can send a JSON error.                         */
  /*─────────────────────────────────────────────────────────────────────────────*/
  const supabaseUrl       = process.env.SUPABASE_URL;
  const serviceRoleKey    = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    /*───────────────────────────────────────────────────────────────────────────*/
    /* 1. Parse body safely                                                     */
    /*───────────────────────────────────────────────────────────────────────────*/
    let body: Record<string, unknown> = {};
    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        body = await req.json();
      } catch {/* empty or invalid JSON → keep `body` = {} */}
    }

    /* 2. Query‑string fallback (works for curl / no‑body requests) */
    const url = new URL(req.url);
    const fileIdParam    = body.fileId ?? url.searchParams.get("fileId");
    const deleteAllParam = body.deleteAll ?? url.searchParams.get("deleteAll");

    const fileId   = typeof fileIdParam === "string" ? fileIdParam : null;
    const deleteAll = deleteAllParam === true || deleteAllParam === "true";

    /*───────────────────────────────────────────────────────────────────────────*/
    /* 3. Delete EVERYTHING branch                                              */
    /*───────────────────────────────────────────────────────────────────────────*/
    if (deleteAll) {
      // delete child rows first (csv_data) then parent (csv_files)
      const { error: dataErr }  = await supabase.from("csv_data").delete().neq("file_id", null);
      if (dataErr) {
        console.error("Supabase csv_data delete error:", dataErr);
        return NextResponse.json({ error: dataErr.message }, { status: 500 });
      }

      const { error: fileErr } = await supabase.from("csv_files").delete().neq("id", null);
      if (fileErr) {
        console.error("Supabase csv_files delete error:", fileErr);
        return NextResponse.json({ error: fileErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "All CSV content deleted." });
    }

    /*───────────────────────────────────────────────────────────────────────────*/
    /* 4. Single‑file delete branch                                             */
    /*───────────────────────────────────────────────────────────────────────────*/
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required unless deleteAll=true." }, { status: 400 });
    }

    const { error: dataErrSingle } = await supabase.from("csv_data").delete().eq("file_id", fileId);
    if (dataErrSingle) {
      console.error(`Supabase csv_data delete error for ${fileId}:`, dataErrSingle);
      return NextResponse.json({ error: dataErrSingle.message }, { status: 500 });
    }

    const { error: fileErrSingle } = await supabase.from("csv_files").delete().eq("id", fileId);
    if (fileErrSingle) {
      console.error(`Supabase csv_files delete error for ${fileId}:`, fileErrSingle);
      return NextResponse.json({ error: fileErrSingle.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `File ${fileId} deleted.` });
  } catch (err) {
    console.error("Unexpected error in DELETE /api/mastra/delete-csv-file:", err);
    const msg = err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
