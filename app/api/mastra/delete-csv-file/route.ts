import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(req: NextRequest) {
  try {
    const { fileId, deleteAll } = await req.json();

    if (deleteAll) {
      console.log("Attempting to delete all CSV data and files.");

      // Delete all data rows first (which reference files)
      // Assumes 'file_id' is always populated for rows in 'csv_data'.
      const { error: dataError } = await supabase.from("csv_data").delete().not("file_id", "is", null);
      if (dataError) {
        console.error("Supabase error deleting from csv_data:", dataError);
        return NextResponse.json({ error: `Failed to delete CSV data: ${dataError.message}` }, { status: 500 });
      }
      console.log("Successfully deleted all entries from csv_data.");

      // Then delete all file metadata rows
      // Assumes 'id' is the primary key and always populated for rows in 'csv_files'.
      const { error: fileError } = await supabase.from("csv_files").delete().not("id", "is", null);
      if (fileError) {
        console.error("Supabase error deleting from csv_files:", fileError);
        return NextResponse.json({ error: `Failed to delete CSV files: ${fileError.message}` }, { status: 500 });
      }
      console.log("Successfully deleted all entries from csv_files.");

      return NextResponse.json({ success: true });
    }

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    console.log(`Attempting to delete file with ID: ${fileId}`);
    // Delete specific file data
    const { error: dataErrorSingle } = await supabase.from("csv_data").delete().eq("file_id", fileId);
    if (dataErrorSingle) {
      console.error(`Supabase error deleting from csv_data for fileId ${fileId}:`, dataErrorSingle);
      return NextResponse.json({ error: `Failed to delete data for file ${fileId}: ${dataErrorSingle.message}` }, { status: 500 });
    }
    console.log(`Successfully deleted entries from csv_data for fileId ${fileId}.`);

    // Delete specific file metadata
    const { error: fileErrorSingle } = await supabase.from("csv_files").delete().eq("id", fileId);
    if (fileErrorSingle) {
      console.error(`Supabase error deleting from csv_files for fileId ${fileId}:`, fileErrorSingle);
      return NextResponse.json({ error: `Failed to delete file metadata ${fileId}: ${fileErrorSingle.message}` }, { status: 500 });
    }
    console.log(`Successfully deleted entry from csv_files for fileId ${fileId}.`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Unexpected error in DELETE /api/mastra/delete-csv-file:", error);
    const message = error instanceof Error ? error.message : "An unexpected server error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 