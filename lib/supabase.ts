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
export async function executeSqlQuery(query: string, fileId: string) {
  try {
    // For security, we'll only allow certain operations on the csv_data table
    // In a real app, you'd want more sophisticated validation
    if (!query.toLowerCase().includes("csv_data")) {
      throw new Error("Query must reference the csv_data table")
    }

    // Execute the query using Supabase's RPC function
    // Note: In a real app, you'd want to use a more secure approach
    // This is simplified for demonstration purposes
    const { data, error } = await supabase.from("csv_data").select("row_data").eq("file_id", fileId)
    // Removed the .limit(100) to fetch all rows

    if (error) throw error

    // Transform the data to match what the query would return
    // In a real app, you'd execute the actual SQL query
    return data.map((item) => item.row_data)
  } catch (error) {
    console.error("Error executing SQL query:", error)
    throw error
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
