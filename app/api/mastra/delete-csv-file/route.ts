import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * DELETE /api/mastra/delete-csv-file
 *
 * Body *(optional)*  : { fileId?: string; deleteAll?: boolean }
 * Query params (fallback): ?fileId=…&deleteAll=true
 *
 * – `deleteAll=true` takes precedence and removes **all** rows in `csv_data`
 *   and `csv_files`.
 * – If `deleteAll` is falsy we require a `fileId` (string) and delete only rows
 *   matching that id.
 *
 * Supabase JS v2 is used, so `.delete()` returns `{ data, error }`. We bail out
 * on the **first** error to avoid partial deletes.
 */
export async function DELETE(req: NextRequest) {
  try {
    /**
     * 1. Parse body _safely_.  Browsers often send DELETE requests **without** a
     *    body, and calling `req.json()` unconditionally would throw.  We only
     *    parse JSON when the header signals it _and_ the stream contains data.
     */
    let body: Record<string, unknown> = {};
    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        body = await req.json();
      } catch {/* ignore empty or invalid JSON */}
    }

    /** 2. Merge body with query‑string fallbacks so the route works from curl */
    const url = new URL(req.url);
    const fileId = (body.fileId ?? url.searchParams.get("fileId")) as string | null;
    const deleteAll = (body.deleteAll ?? url.searchParams.get("deleteAll")) === true ||
                      (url.searchParams.get("deleteAll") === "true");

    /** 3. Handle the “delete everything” branch first */
    if (deleteAll) {
      // Delete rows in an order that honours FK constraints (csv_data → csv_files)
      const { error: dataError } = await supabase.from("csv_data").delete().neq("file_id", null);
      if (dataError) {
        console.error("Supabase error deleting csv_data:", dataError);
        return NextResponse.json({ error: dataError.message }, { status: 500 });
      }

      const { error: fileError } = await supabase.from("csv_files").delete().neq("id", null);
      if (fileError) {
        console.error("Supabase error deleting csv_files:", fileError);
        return NextResponse.json({ error: fileError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "All CSV data and metadata deleted." });
    }

    /** 4. Validate `fileId` for single‑file delete */
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required unless deleteAll is true." }, { status: 400 });
    }

    // a. Delete CSV rows referencing the file
    const { error: dataErrorSingle } = await supabase.from("csv_data").delete().eq("file_id", fileId);
    if (dataErrorSingle) {
      console.error(`Supabase error deleting csv_data for ${fileId}:`, dataErrorSingle);
      return NextResponse.json({ error: dataErrorSingle.message }, { status: 500 });
    }

    // b. Delete the file metadata row itself
    const { error: fileErrorSingle } = await supabase.from("csv_files").delete().eq("id", fileId);
    if (fileErrorSingle) {
      console.error(`Supabase error deleting csv_files for ${fileId}:`, fileErrorSingle);
      return NextResponse.json({ error: fileErrorSingle.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `File ${fileId} deleted.` });
  } catch (err) {
    console.error("Unexpected error in DELETE /api/mastra/delete-csv-file:", err);
    const message = err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
