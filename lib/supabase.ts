"use client"

import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Create a single supabase client for the entire app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Upload CSV to Supabase
export async function uploadCsv(file: File, parsedData: { columns: string[]; rows: any[] }) {
  try {
    // Generate a unique ID for the file
    const fileId = uuidv4()

    // Insert file metadata
    const { error: metadataError } = await supabase.from("csv_files").insert({
      id: fileId,
      filename: `${fileId}-${file.name}`,
      original_filename: file.name,
      size_bytes: file.size,
      row_count: parsedData.rows.length,
      column_names: parsedData.columns,
    })

    if (metadataError) throw new Error(`Failed to insert metadata: ${metadataError.message}`)

    // Insert all rows in batches
    const BATCH_SIZE = 100
    for (let i = 0; i < parsedData.rows.length; i += BATCH_SIZE) {
      const batch = parsedData.rows.slice(i, i + BATCH_SIZE).map((row, index) => ({
        file_id: fileId,
        row_index: i + index,
        row_data: row,
      }))

      const { error: dataError } = await supabase.from("csv_data").insert(batch)

      if (dataError) throw new Error(`Failed to insert data batch: ${dataError.message}`)
    }

    return { id: fileId, success: true }
  } catch (error) {
    console.error("Error uploading CSV:", error)
    throw error
  }
}

// Get SQL templates
export async function getSqlTemplates() {
  try {
    const { data, error } = await supabase.from("sql_queries").select("*").eq("is_template", true)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching SQL templates:", error)
    throw error
  }
}

// Execute SQL query without row limit
export async function executeSqlQuery(query: string) {
  try {
    // Validate the query string to ensure it's a SELECT statement
    // The AI should generate queries for "user_data" table as per previous instructions.
    if (!query.trim().toUpperCase().startsWith("SELECT")) {
      throw new Error("Only SELECT queries are allowed.");
    }

    // Execute the query using Supabase's RPC function
    const { data, error } = await supabase.rpc('execute_dynamic_select', { query: query });

    if (error) {
      console.error("Error from RPC:", error);
      // Provide more specific error information if available
      const errorMessage = error.message || "Unknown RPC error";
      const errorDetails = error.details ? `Details: ${error.details}` : "";
      const errorCode = error.code ? `Code: ${error.code}` : "";
      const errorHint = error.hint ? `Hint: ${error.hint}` : "";
      throw new Error(`Error executing SQL via RPC: ${errorMessage}. ${errorDetails} ${errorCode} ${errorHint}`);
    }

    // The 'data' variable now holds the actual result from the executed query.
    // No more manual mapping is needed if the RPC function returns the correct format.
    return data;
  } catch (error) {
    console.error("Error executing SQL query:", error);
    // Ensure the caught error is re-thrown to be handled by the caller
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while executing the SQL query.");
  }
}

// Save SQL query
export async function saveSqlQuery(query: string, fileId: string) {
  try {
    const { error } = await supabase.from("sql_queries").insert({
      query_text: query,
      file_id: fileId,
      is_template: false,
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error saving SQL query:", error)
    throw error
  }
}

// Get CSV file by ID
export async function getCsvFileById(fileId: string) {
  try {
    const { data, error } = await supabase.from("csv_files").select("*").eq("id", fileId).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching CSV file:", error)
    throw error
  }
}

// Get CSV data by file ID with pagination
export async function getCsvDataByFileId(fileId: string, limit = 20, offset = 0) {
  try {
    const { data, error } = await supabase
      .from("csv_data")
      .select("row_data")
      .eq("file_id", fileId)
      .order("row_index", { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data.map((item) => item.row_data)
  } catch (error) {
    console.error("Error fetching CSV data:", error)
    throw error
  }
}

// Get list of all CSV files
export async function getCsvFilesList() {
  try {
    const { data, error } = await supabase
      .from("csv_files")
      .select("id, original_filename, size_bytes, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data.map((file) => ({
      id: file.id,
      name: file.original_filename,
      size: file.size_bytes,
      createdAt: file.created_at,
    }))
  } catch (error) {
    console.error("Error fetching CSV files list:", error)
    throw error
  }
}

// Get the file_id for a given original_filename (most recent if duplicates)
export async function getFileIdByOriginalFilename(originalFilename: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("csv_files")
      .select("id") // We only need the id
      .eq("original_filename", originalFilename)
      .order("created_at", { ascending: false }) // Get the most recent if multiple exist
      .limit(1) // We only want one record
      .single(); // Expect a single row or null if no match after limit(1)

    if (error) {
      // .single() can error if no rows are found (PGRST116) or if multiple rows are found (unexpected with .limit(1))
      // We want to return null if no file is found, so we can specifically check for PGRST116 or if data is null
      if (error.code === 'PGRST116' || !data) {
        console.warn(`No file found with original_filename: ${originalFilename}`);
        return null;
      }
      // For other errors, re-throw them
      console.error(`Error fetching file ID for original_filename ${originalFilename}:`, error);
      throw error; 
    }
    
    // If data is not null and no error, return the id
    return data ? data.id : null;
  } catch (err) {
    // Catch any re-thrown errors or unexpected errors during the try block
    console.error(`Exception fetching file ID for ${originalFilename}:`, err);
    return null; 
  }
}
