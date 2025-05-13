import { NextRequest, NextResponse } from "next/server";
import { createClient, type PostgrestError } from "@supabase/supabase-js";

/* ————————————————————— helpers ————————————————————— */
const isUUID = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const shapeError = (e: PostgrestError) => ({
  message: e.message,
  details: e.details ?? null,
  hint: e.hint ?? null,
  code: e.code ?? null,
});

/* ————————————————————— handler ————————————————————— */
export async function DELETE(req: NextRequest) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set" },
      { status: 500 },
    );
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    /* 1. pull body + query params safely */
    let body: Record<string, unknown> = {};
    if (req.headers.get("content-type")?.includes("application/json")) {
      try { body = await req.json(); } catch { /* ignore */ }
    }
    const url          = new URL(req.url);
    const fileIdParam  = body.fileId   ?? url.searchParams.get("fileId");
    const deleteAllRaw = body.deleteAll ?? url.searchParams.get("deleteAll");
    const deleteAll    = deleteAllRaw === true || deleteAllRaw === "true";
    const fileId       = isUUID(fileIdParam) ? fileIdParam : null;

    console.log("DELETE /mastra/delete-csv-file", { fileId, deleteAll });

    /* 2. delete everything --------------------------------------------------- */
    if (deleteAll) {
      // use .not('col','is',null)  -> …NOT IS NULL (no value sent)
      const { error: dataErr }  =
        await supabase.from("csv_data").delete().not("file_id", "is", null);
      if (dataErr) return NextResponse.json(
        { error: shapeError(dataErr) }, { status: 500 });

      const { error: fileErr } =
        await supabase.from("csv_files").delete().not("id", "is", null);
      if (fileErr) return NextResponse.json(
        { error: shapeError(fileErr) }, { status: 500 });

      return NextResponse.json({ success: true, message: "All CSV content deleted." });
    }

    /* 3. delete a single file ----------------------------------------------- */
    if (!fileId) {
      return NextResponse.json(
        { error: "Valid fileId is required unless deleteAll=true." },
        { status: 400 },
      );
    }

    const { error: dataErr } =
      await supabase.from("csv_data").delete().eq("file_id", fileId);
    if (dataErr) return NextResponse.json(
      { error: shapeError(dataErr) }, { status: 500 });

    const { error: fileErr } =
      await supabase.from("csv_files").delete().eq("id", fileId);
    if (fileErr) return NextResponse.json(
      { error: shapeError(fileErr) }, { status: 500 });

    return NextResponse.json({ success: true, message: `File ${fileId} deleted.` });

  } catch (err) {
    console.error("DELETE /mastra/delete-csv-file failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
